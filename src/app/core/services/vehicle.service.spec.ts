import { TestBed } from '@angular/core/testing';
import { VehicleService } from './vehicle.service';
import { VehicleInput } from '../../data-access/vehicle.models';
import { loadVehicles } from '../../data-access/vehicle.data';

const VEHICLES_KEY = 'garariel.vehicles';

function input(overrides: Partial<VehicleInput> = {}): VehicleInput {
  return {
    plate: 'ZZ-000-ZZ',
    make: 'Nouvelle',
    model: 'Modèle',
    year: 2022,
    clientId: 'client-1',
    ...overrides,
  };
}

function reload(): VehicleService {
  TestBed.resetTestingModule();
  return TestBed.inject(VehicleService);
}

describe('VehicleService', () => {
  let service: VehicleService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(VehicleService);
  });

  it('exposes the seeded vehicles on first load', () => {
    expect(service.vehicles().length).toBeGreaterThan(0);
    expect(service.count()).toBe(service.vehicles().length);
  });

  it('creates a vehicle and persists it', () => {
    const before = service.count();
    const created = service.create(input());

    expect(created.id).toBeTruthy();
    expect(service.count()).toBe(before + 1);
    expect(service.getById(created.id)).toEqual(created);
    expect(localStorage.getItem(VEHICLES_KEY)).toContain(created.id);
    expect(loadVehicles()?.some((vehicle) => vehicle.id === created.id)).toBe(true);
  });

  it('trims values and keeps a missing year undefined', () => {
    const created = service.create(input({ plate: '  XX-111-XX  ', make: '  Ford  ', year: undefined }));
    expect(created.plate).toBe('XX-111-XX');
    expect(created.make).toBe('Ford');
    expect(created.year).toBeUndefined();
  });

  it('updates a vehicle and persists the change', () => {
    const created = service.create(input());
    const updated = service.update(created.id, input({ model: 'Modifié', year: 2023 }));

    expect(updated?.model).toBe('Modifié');
    expect(service.getById(created.id)?.model).toBe('Modifié');
    expect(service.getById(created.id)?.year).toBe(2023);
    expect(service.getById(created.id)?.updatedAt).toBeGreaterThanOrEqual(created.updatedAt);
    expect(loadVehicles()?.find((vehicle) => vehicle.id === created.id)?.model).toBe('Modifié');
  });

  it('clears the year when an update omits it', () => {
    const created = service.create(input({ year: 2020 }));
    const updated = service.update(created.id, input({ year: undefined }));
    expect(updated?.year).toBeUndefined();
    expect(loadVehicles()?.find((vehicle) => vehicle.id === created.id)?.year).toBeUndefined();
  });

  it('returns undefined when updating an unknown vehicle', () => {
    expect(service.update('does-not-exist', input())).toBeUndefined();
  });

  it('deletes a vehicle and removes it from the list and storage', () => {
    const created = service.create(input());
    expect(service.delete(created.id)).toBe(true);
    expect(service.getById(created.id)).toBeUndefined();
    expect(loadVehicles()?.some((vehicle) => vehicle.id === created.id)).toBe(false);
  });

  it('returns false when deleting an unknown vehicle', () => {
    expect(service.delete('does-not-exist')).toBe(false);
  });

  it('keeps vehicles after a simulated reload', () => {
    const created = service.create(input({ make: 'Persistante' }));
    const reloaded = reload();

    expect(reloaded.getById(created.id)?.make).toBe('Persistante');
  });

  describe('search and list states', () => {
    it('filters by make, case-insensitively', () => {
      service.setQuery('renault');
      expect(service.filteredVehicles().length).toBe(1);
      expect(service.filteredVehicles()[0].make).toBe('Renault');
    });

    it('filters by model', () => {
      service.setQuery('clio');
      expect(service.filteredVehicles().length).toBe(1);
      expect(service.filteredVehicles()[0].model).toBe('Clio');
    });

    it('filters by plate ignoring separators', () => {
      service.setQuery('ab123');
      expect(service.filteredVehicles().length).toBe(1);
      expect(service.filteredVehicles()[0].plate).toBe('AB-123-CD');
    });

    it('ignores accents and case', () => {
      service.setQuery('CITROEN');
      expect(service.filteredVehicles().length).toBe(1);
      expect(service.filteredVehicles()[0].make).toBe('Citroën');
    });

    it('does not search on the owner client name', () => {
      service.setQuery('Camille Durand');
      expect(service.filteredVehicles()).toEqual([]);
      expect(service.isNoResult()).toBe(true);
    });

    it('reports the no-result state and clears it', () => {
      service.setQuery('zzz-unknown');
      expect(service.filteredVehicles()).toEqual([]);
      expect(service.hasResults()).toBe(false);
      expect(service.resultCount()).toBe(0);
      expect(service.isNoResult()).toBe(true);

      service.clearQuery();
      expect(service.query()).toBe('');
      expect(service.filteredVehicles().length).toBe(service.count());
      expect(service.isNoResult()).toBe(false);
    });

    it('reports the empty state when no vehicle exists', () => {
      for (const vehicle of service.vehicles()) {
        service.delete(vehicle.id);
      }
      expect(service.isEmpty()).toBe(true);
      expect(service.hasVehicles()).toBe(false);
      expect(service.isNoResult()).toBe(false);
    });
  });
});
