import { Injectable, computed, signal } from '@angular/core';
import { Client, ClientInput } from '../../data-access/client.models';
import { loadOrSeedClients, saveClients } from '../../data-access/client.data';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function matchesQuery(client: Client, rawQuery: string): boolean {
  const query = normalize(rawQuery);
  if (!query) return true;
  if (normalize(client.fullName).includes(query)) return true;
  if (normalize(client.email).includes(query)) return true;

  const queryDigits = digitsOnly(rawQuery);
  if (queryDigits && digitsOnly(client.phone).includes(queryDigits)) return true;
  return normalize(client.phone).includes(query);
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly _clients = signal<Client[]>(loadOrSeedClients());
  private readonly _query = signal('');

  readonly clients = this._clients.asReadonly();
  readonly query = this._query.asReadonly();
  readonly count = computed(() => this._clients().length);
  readonly filteredClients = computed(() => {
    const query = this._query();
    return this._clients().filter((client) => matchesQuery(client, query));
  });
  readonly resultCount = computed(() => this.filteredClients().length);
  readonly hasClients = computed(() => this._clients().length > 0);
  readonly hasResults = computed(() => this.filteredClients().length > 0);
  /** No clients exist at all. */
  readonly isEmpty = computed(() => this._clients().length === 0);
  /** Clients exist but the current search matches none. */
  readonly isNoResult = computed(
    () => this._clients().length > 0 && this.filteredClients().length === 0
  );

  setQuery(value: string): void {
    this._query.set(value);
  }

  clearQuery(): void {
    this._query.set('');
  }

  getById(id: string): Client | undefined {
    return this._clients().find((client) => client.id === id);
  }

  create(input: ClientInput): Client {
    const now = Date.now();
    const client: Client = {
      id: this.newId(),
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      address: input.address?.trim() ?? '',
      createdAt: now,
      updatedAt: now,
    };
    this.commit([...this._clients(), client]);
    return client;
  }

  update(id: string, input: ClientInput): Client | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const updated: Client = {
      ...existing,
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      address: input.address?.trim() ?? '',
      updatedAt: Date.now(),
    };
    this.commit(this._clients().map((client) => (client.id === id ? updated : client)));
    return updated;
  }

  delete(id: string): boolean {
    if (!this.getById(id)) return false;
    this.commit(this._clients().filter((client) => client.id !== id));
    return true;
  }

  private commit(clients: Client[]): void {
    this._clients.set(clients);
    saveClients(clients);
  }

  private newId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
