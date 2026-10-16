import { buildSeedVehicles, loadOrSeedVehicles, loadVehicles, saveVehicles } from './vehicle.data';
import { Vehicle } from './vehicle.models';

const VEHICLES_KEY = 'garariel.vehicles';

function sampleVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'vehicle-x',
    plate: 'AA-000-AA',
    make: 'Test',
    model: 'Model',
    year: 2000,
    clientId: 'client-1',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('vehicle.data', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no vehicles are stored', () => {
    expect(loadVehicles()).toBeNull();
  });

  it('returns null when stored data is unreadable', () => {
    localStorage.setItem(VEHICLES_KEY, '{ not valid json');
    expect(loadVehicles()).toBeNull();
  });

  it('returns null when stored data is not an array', () => {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify({ not: 'an array' }));
    expect(loadVehicles()).toBeNull();
  });

  it('drops incomplete entries and keeps well-formed ones', () => {
    const valid = sampleVehicle();
    const withoutYear = sampleVehicle({ id: 'vehicle-no-year', year: undefined });
    localStorage.setItem(
      VEHICLES_KEY,
      JSON.stringify([valid, withoutYear, { id: 'broken' }, null, 42])
    );
    expect(loadVehicles()).toEqual([valid, withoutYear]);
  });

  it('keeps an explicitly empty list empty instead of reseeding', () => {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify([]));
    expect(loadVehicles()).toEqual([]);
    expect(loadOrSeedVehicles()).toEqual([]);
  });

  it('round-trips vehicles through localStorage', () => {
    const vehicles = [sampleVehicle(), sampleVehicle({ id: 'vehicle-y', make: 'Autre' })];
    saveVehicles(vehicles);
    expect(loadVehicles()).toEqual(vehicles);
  });

  it('builds a deterministic seed referencing the seeded clients', () => {
    expect(buildSeedVehicles()).toEqual(buildSeedVehicles());
    expect(buildSeedVehicles().length).toBeGreaterThan(0);
    for (const vehicle of buildSeedVehicles()) {
      expect(vehicle.clientId).toMatch(/^client-/);
    }
  });

  it('seeds and persists deterministic data when storage is empty', () => {
    const vehicles = loadOrSeedVehicles();
    expect(vehicles).toEqual(buildSeedVehicles());
    expect(loadVehicles()).toEqual(vehicles);
  });

  it('returns already stored vehicles without reseeding', () => {
    const stored = [sampleVehicle({ id: 'vehicle-stored' })];
    saveVehicles(stored);
    expect(loadOrSeedVehicles()).toEqual(stored);
  });
});
