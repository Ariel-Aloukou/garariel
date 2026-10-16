import {
  buildSeedInterventions,
  loadInterventions,
  loadOrSeedInterventions,
  saveInterventions,
} from './intervention.data';
import { Intervention } from './intervention.models';

const INTERVENTIONS_KEY = 'garariel.interventions';

function sampleIntervention(overrides: Partial<Intervention> = {}): Intervention {
  return {
    id: 'intervention-x',
    vehicleId: 'vehicle-1',
    date: '2026-01-01',
    problem: 'Problème',
    status: 'pending',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('intervention.data', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no interventions are stored', () => {
    expect(loadInterventions()).toBeNull();
  });

  it('returns null when stored data is unreadable', () => {
    localStorage.setItem(INTERVENTIONS_KEY, '{ not valid json');
    expect(loadInterventions()).toBeNull();
  });

  it('returns null when stored data is not an array', () => {
    localStorage.setItem(INTERVENTIONS_KEY, JSON.stringify({ not: 'an array' }));
    expect(loadInterventions()).toBeNull();
  });

  it('drops incomplete entries and keeps well-formed ones', () => {
    const full = sampleIntervention();
    const minimal = sampleIntervention({ id: 'intervention-minimal' });
    localStorage.setItem(
      INTERVENTIONS_KEY,
      JSON.stringify([
        full,
        minimal,
        { id: 'broken' },
        sampleIntervention({ status: 'unknown' as Intervention['status'] }),
        sampleIntervention({ cost: 'gratuit' as unknown as number }),
        null,
        42,
      ])
    );
    expect(loadInterventions()).toEqual([full, minimal]);
  });

  it('keeps an explicitly empty list empty instead of reseeding', () => {
    localStorage.setItem(INTERVENTIONS_KEY, JSON.stringify([]));
    expect(loadInterventions()).toEqual([]);
    expect(loadOrSeedInterventions()).toEqual([]);
  });

  it('round-trips interventions through localStorage', () => {
    const interventions = [sampleIntervention(), sampleIntervention({ id: 'intervention-y' })];
    saveInterventions(interventions);
    expect(loadInterventions()).toEqual(interventions);
  });

  it('builds a deterministic seed referencing the seeded vehicles and covering every status', () => {
    expect(buildSeedInterventions()).toEqual(buildSeedInterventions());
    expect(buildSeedInterventions().length).toBeGreaterThan(0);

    const statuses = new Set(buildSeedInterventions().map((intervention) => intervention.status));
    expect(statuses).toEqual(new Set(['pending', 'in_progress', 'done']));

    for (const intervention of buildSeedInterventions()) {
      expect(intervention.vehicleId).toMatch(/^vehicle-/);
    }
  });

  it('seeds and persists deterministic data when storage is empty', () => {
    const interventions = loadOrSeedInterventions();
    expect(interventions).toEqual(buildSeedInterventions());
    expect(loadInterventions()).toEqual(interventions);
  });

  it('returns already stored interventions without reseeding', () => {
    const stored = [sampleIntervention({ id: 'intervention-stored' })];
    saveInterventions(stored);
    expect(loadOrSeedInterventions()).toEqual(stored);
  });
});
