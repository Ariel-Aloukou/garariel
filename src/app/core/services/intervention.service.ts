import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Intervention,
  InterventionInput,
  InterventionStatus,
} from '../../data-access/intervention.models';
import { loadOrSeedInterventions, saveInterventions } from '../../data-access/intervention.data';
import { VehicleService } from './vehicle.service';
import { ClientService } from './client.service';

/** Status filter value: `all` disables the status filter. */
export type StatusFilter = 'all' | InterventionStatus;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Plate comparison ignores usual separators (spaces, hyphens). */
function compact(value: string): string {
  return normalize(value).replace(/[\s-]/g, '');
}

@Injectable({ providedIn: 'root' })
export class InterventionService {
  private readonly vehicles = inject(VehicleService);
  private readonly clients = inject(ClientService);

  private readonly _interventions = signal<Intervention[]>(loadOrSeedInterventions());
  private readonly _query = signal('');
  private readonly _status = signal<StatusFilter>('all');
  private readonly _dateFrom = signal('');
  private readonly _dateTo = signal('');

  readonly interventions = this._interventions.asReadonly();
  readonly query = this._query.asReadonly();
  readonly statusFilter = this._status.asReadonly();
  readonly dateFrom = this._dateFrom.asReadonly();
  readonly dateTo = this._dateTo.asReadonly();

  readonly count = computed(() => this._interventions().length);
  readonly filteredInterventions = computed(() =>
    this._interventions().filter(
      (intervention) => this.matchesFilters(intervention) && this.matchesQuery(intervention, this._query())
    )
  );
  readonly resultCount = computed(() => this.filteredInterventions().length);
  readonly hasInterventions = computed(() => this._interventions().length > 0);
  readonly hasResults = computed(() => this.filteredInterventions().length > 0);
  /** No interventions exist at all. */
  readonly isEmpty = computed(() => this._interventions().length === 0);
  /** Interventions exist but the current search/filters match none. */
  readonly isNoResult = computed(
    () => this._interventions().length > 0 && this.filteredInterventions().length === 0
  );
  /** True when a search term or filter is active. */
  readonly hasActiveFilters = computed(
    () => this._query() !== '' || this._status() !== 'all' || this._dateFrom() !== '' || this._dateTo() !== ''
  );

  setQuery(query: string): void {
    this._query.set(query);
  }

  clearQuery(): void {
    this._query.set('');
  }

  setStatusFilter(status: StatusFilter): void {
    this._status.set(status);
  }

  setDateFrom(date: string): void {
    this._dateFrom.set(date);
  }

  setDateTo(date: string): void {
    this._dateTo.set(date);
  }

  clearFilters(): void {
    this._query.set('');
    this._status.set('all');
    this._dateFrom.set('');
    this._dateTo.set('');
  }

  getById(id: string): Intervention | undefined {
    return this._interventions().find((intervention) => intervention.id === id);
  }

  create(input: InterventionInput): Intervention {
    const now = Date.now();
    const intervention: Intervention = {
      id: this.newId(),
      vehicleId: input.vehicleId,
      date: input.date.trim(),
      problem: input.problem.trim(),
      ...(input.diagnosis ? { diagnosis: input.diagnosis.trim() } : {}),
      ...(input.workDone ? { workDone: input.workDone.trim() } : {}),
      ...(input.cost === undefined ? {} : { cost: input.cost }),
      status: input.status ?? 'pending',
      createdAt: now,
      updatedAt: now,
    };
    this.commit([...this._interventions(), intervention]);
    return intervention;
  }

  update(id: string, input: InterventionInput): Intervention | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const updated: Intervention = {
      ...existing,
      vehicleId: input.vehicleId,
      date: input.date.trim(),
      problem: input.problem.trim(),
      diagnosis: input.diagnosis ? input.diagnosis.trim() : undefined,
      workDone: input.workDone ? input.workDone.trim() : undefined,
      cost: input.cost,
      status: input.status ?? existing.status,
      updatedAt: Date.now(),
    };
    this.commit(this._interventions().map((intervention) => (intervention.id === id ? updated : intervention)));
    return updated;
  }

  delete(id: string): boolean {
    if (!this.getById(id)) return false;
    this.commit(this._interventions().filter((intervention) => intervention.id !== id));
    return true;
  }

  /** Search scope: immatriculation, marque, modèle and owner name of the attached vehicle. */
  private matchesQuery(intervention: Intervention, rawQuery: string): boolean {
    const query = normalize(rawQuery);
    if (!query) return true;

    const vehicle = this.vehicles.getById(intervention.vehicleId);
    if (!vehicle) return false;
    if (normalize(vehicle.make).includes(query)) return true;
    if (normalize(vehicle.model).includes(query)) return true;

    const owner = this.clients.getById(vehicle.clientId);
    if (owner && normalize(owner.fullName).includes(query)) return true;

    const compactQuery = compact(rawQuery);
    if (compactQuery && compact(vehicle.plate).includes(compactQuery)) return true;
    return normalize(vehicle.plate).includes(query);
  }

  private matchesFilters(intervention: Intervention): boolean {
    const status = this._status();
    if (status !== 'all' && intervention.status !== status) return false;

    const from = this._dateFrom();
    if (from && intervention.date < from) return false;

    const to = this._dateTo();
    if (to && intervention.date > to) return false;

    return true;
  }

  private commit(interventions: Intervention[]): void {
    this._interventions.set(interventions);
    saveInterventions(interventions);
  }

  private newId(): string {
    return `intervention-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
