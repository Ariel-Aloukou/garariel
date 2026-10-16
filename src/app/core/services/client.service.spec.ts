import { TestBed } from '@angular/core/testing';
import { ClientService } from './client.service';
import { ClientInput } from '../../data-access/client.models';

const CLIENTS_KEY = 'garariel.clients';

function input(overrides: Partial<ClientInput> = {}): ClientInput {
  return {
    fullName: 'Nouveau Client',
    phone: '0612345678',
    email: 'nouveau@example.com',
    address: '1 rue de la Paix',
    ...overrides,
  };
}

function reload(): ClientService {
  TestBed.resetTestingModule();
  const service = TestBed.inject(ClientService);
  return service;
}

describe('ClientService', () => {
  let service: ClientService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientService);
  });

  it('exposes the seeded clients on first load', () => {
    expect(service.clients().length).toBeGreaterThan(0);
    expect(service.count()).toBe(service.clients().length);
  });

  it('creates a client and persists it', () => {
    const before = service.count();
    const created = service.create(input());

    expect(created.id).toBeTruthy();
    expect(service.count()).toBe(before + 1);
    expect(service.getById(created.id)).toEqual(created);
    expect(localStorage.getItem(CLIENTS_KEY)).toContain(created.id);
  });

  it('trims values and defaults a missing address to an empty string', () => {
    const created = service.create(input({ fullName: '  Léa  ', address: undefined }));
    expect(created.fullName).toBe('Léa');
    expect(created.address).toBe('');
  });

  it('updates a client and reflects the change', () => {
    const created = service.create(input());
    const updated = service.update(created.id, input({ fullName: 'Nom Modifié', phone: '0700000000' }));

    expect(updated?.fullName).toBe('Nom Modifié');
    expect(service.getById(created.id)?.fullName).toBe('Nom Modifié');
    expect(service.getById(created.id)?.updatedAt).toBeGreaterThanOrEqual(created.updatedAt);
  });

  it('returns undefined when updating an unknown client', () => {
    expect(service.update('does-not-exist', input())).toBeUndefined();
  });

  it('deletes a client and removes it from the list', () => {
    const created = service.create(input());
    expect(service.delete(created.id)).toBe(true);
    expect(service.getById(created.id)).toBeUndefined();
    expect(service.clients().some((c) => c.id === created.id)).toBe(false);
  });

  it('returns false when deleting an unknown client', () => {
    expect(service.delete('does-not-exist')).toBe(false);
  });

  it('keeps clients after a simulated reload', () => {
    const created = service.create(input({ fullName: 'Persistant' }));
    const reloaded = reload();

    expect(reloaded.getById(created.id)?.fullName).toBe('Persistant');
  });

  describe('search and list states', () => {
    it('filters by full name, case-insensitively', () => {
      service.setQuery('camille');
      expect(service.filteredClients().length).toBe(1);
      expect(service.filteredClients()[0].fullName).toBe('Camille Durand');
    });

    it('filters by email', () => {
      service.setQuery('lea.moreau@');
      expect(service.filteredClients().length).toBe(1);
      expect(service.filteredClients()[0].email).toBe('lea.moreau@example.com');
    });

    it('filters by phone digits regardless of formatting', () => {
      service.setQuery('9876');
      expect(service.filteredClients().length).toBe(1);
      expect(service.filteredClients()[0].phone).toContain('98');
    });

    it('ignores accents and case', () => {
      service.setQuery('LEA');
      expect(service.filteredClients().length).toBe(1);
      expect(service.filteredClients()[0].fullName).toBe('Léa Moreau');
    });

    it('reports the no-result state and clears it', () => {
      service.setQuery('zzz-unknown');
      expect(service.filteredClients()).toEqual([]);
      expect(service.hasResults()).toBe(false);
      expect(service.resultCount()).toBe(0);
      expect(service.isNoResult()).toBe(true);

      service.clearQuery();
      expect(service.query()).toBe('');
      expect(service.filteredClients().length).toBe(service.count());
      expect(service.isNoResult()).toBe(false);
    });

    it('reports the empty state when no client exists', () => {
      for (const client of service.clients()) {
        service.delete(client.id);
      }
      expect(service.isEmpty()).toBe(true);
      expect(service.hasClients()).toBe(false);
      expect(service.isNoResult()).toBe(false);
    });
  });
});
