import { TestBed } from '@angular/core/testing';
import { InterventionService } from './intervention.service';
import { InterventionInput, InterventionStatus } from '../../data-access/intervention.models';
import { loadInterventions } from '../../data-access/intervention.data';

const INTERVENTIONS_KEY = 'garariel.interventions';

function input(overrides: Partial<InterventionInput> = {}): InterventionInput {
  return {
    vehicleId: 'vehicle-1',
    date: '2026-10-16',
    problem: 'Nouveau problème',
    status: 'pending',
    ...overrides,
  };
}

function reload(): InterventionService {
  TestBed.resetTestingModule();
  return TestBed.inject(InterventionService);
}

describe('InterventionService', () => {
  let service: InterventionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(InterventionService);
  });

  it('exposes the seeded interventions on first load', () => {
    expect(service.interventions().length).toBeGreaterThan(0);
    expect(service.count()).toBe(service.interventions().length);
  });

  it('creates an intervention and persists it', () => {
    const before = service.count();
    const created = service.create(input({ problem: '  Freins qui grincent  ' }));

    expect(created.id).toBeTruthy();
    expect(created.problem).toBe('Freins qui grincent');
    expect(service.count()).toBe(before + 1);
    expect(service.getById(created.id)).toEqual(created);
    expect(localStorage.getItem(INTERVENTIONS_KEY)).toContain(created.id);
    expect(loadInterventions()?.some((intervention) => intervention.id === created.id)).toBe(true);
  });

  it('defaults the status to pending and keeps optional fields undefined', () => {
    const created = service.create({ ...input(), status: undefined as unknown as InterventionStatus });

    expect(created.status).toBe('pending');
    expect(created.diagnosis).toBeUndefined();
    expect(created.workDone).toBeUndefined();
    expect(created.cost).toBeUndefined();
  });

  it('stores the optional diagnosis, work done and cost when provided', () => {
    const created = service.create(
      input({ diagnosis: 'Plaquettes usées', workDone: 'Remplacement', cost: 120.5 })
    );
    expect(created.diagnosis).toBe('Plaquettes usées');
    expect(created.workDone).toBe('Remplacement');
    expect(created.cost).toBe(120.5);
  });

  it('updates an intervention including its status and persists the change', () => {
    const created = service.create(input());
    const updated = service.update(
      created.id,
      input({ problem: 'Problème modifié', status: 'in_progress', cost: 50 })
    );

    expect(updated?.problem).toBe('Problème modifié');
    expect(updated?.status).toBe('in_progress');
    expect(service.getById(created.id)?.status).toBe('in_progress');
    expect(service.getById(created.id)?.cost).toBe(50);
    expect(service.getById(created.id)?.updatedAt).toBeGreaterThanOrEqual(created.updatedAt);
    expect(loadInterventions()?.find((intervention) => intervention.id === created.id)?.problem).toBe(
      'Problème modifié'
    );
  });

  it('clears an optional field when an update omits it', () => {
    const created = service.create(input({ diagnosis: 'Ancien diagnostic', cost: 100 }));
    const updated = service.update(created.id, input());
    expect(updated?.diagnosis).toBeUndefined();
    expect(updated?.cost).toBeUndefined();
    expect(loadInterventions()?.find((intervention) => intervention.id === created.id)?.cost).toBeUndefined();
  });

  it('returns undefined when updating an unknown intervention', () => {
    expect(service.update('does-not-exist', input())).toBeUndefined();
  });

  it('deletes an intervention and removes it from the list and storage', () => {
    const created = service.create(input());
    expect(service.delete(created.id)).toBe(true);
    expect(service.getById(created.id)).toBeUndefined();
    expect(loadInterventions()?.some((intervention) => intervention.id === created.id)).toBe(false);
  });

  it('returns false when deleting an unknown intervention', () => {
    expect(service.delete('does-not-exist')).toBe(false);
  });

  it('keeps interventions after a simulated reload', () => {
    const created = service.create(input({ problem: 'Persistante' }));
    const reloaded = reload();
    expect(reloaded.getById(created.id)?.problem).toBe('Persistante');
  });

  describe('search and filters', () => {
    it('filters by vehicle make', () => {
      service.setQuery('renault');
      expect(service.filteredInterventions().map((intervention) => intervention.id)).toEqual([
        'intervention-1',
      ]);
    });

    it('filters by vehicle plate ignoring separators', () => {
      service.setQuery('ab123');
      expect(service.filteredInterventions().map((intervention) => intervention.id)).toEqual([
        'intervention-1',
      ]);
    });

    it('filters by owner name, accent- and case-insensitively', () => {
      service.setQuery('CAMILLE DURAND');
      expect(service.filteredInterventions().map((intervention) => intervention.id)).toEqual([
        'intervention-1',
      ]);
    });

    it('filters by vehicle model', () => {
      service.setQuery('yaris');
      expect(service.filteredInterventions().map((intervention) => intervention.id)).toEqual([
        'intervention-3',
      ]);
    });

    it('reports the no-result state and clears it', () => {
      service.setQuery('zzz-unknown');
      expect(service.filteredInterventions()).toEqual([]);
      expect(service.hasResults()).toBe(false);
      expect(service.resultCount()).toBe(0);
      expect(service.isNoResult()).toBe(true);

      service.clearQuery();
      expect(service.query()).toBe('');
      expect(service.filteredInterventions().length).toBe(service.count());
      expect(service.isNoResult()).toBe(false);
    });

    it('filters by status', () => {
      service.setStatusFilter('done');
      expect(service.filteredInterventions().map((intervention) => intervention.id)).toEqual([
        'intervention-1',
      ]);

      service.setStatusFilter('pending');
      expect(service.filteredInterventions().map((intervention) => intervention.id)).toEqual([
        'intervention-3',
      ]);
    });

    it('filters by date range with optional bounds', () => {
      service.setDateFrom('2026-10-01');
      expect(service.filteredInterventions().map((intervention) => intervention.id)).toEqual([
        'intervention-2',
        'intervention-3',
      ]);

      service.setDateFrom('');
      service.setDateTo('2026-10-05');
      expect(service.filteredInterventions().map((intervention) => intervention.id)).toEqual([
        'intervention-1',
        'intervention-2',
      ]);
    });

    it('combines search, status and date filters with AND logic', () => {
      service.setQuery('citroen');
      service.setStatusFilter('in_progress');
      service.setDateFrom('2026-10-01');
      service.setDateTo('2026-10-05');
      expect(service.filteredInterventions().map((intervention) => intervention.id)).toEqual([
        'intervention-2',
      ]);

      service.setStatusFilter('done');
      expect(service.filteredInterventions()).toEqual([]);
      expect(service.isNoResult()).toBe(true);
    });

    it('reports whether any filter is active and clears them all', () => {
      expect(service.hasActiveFilters()).toBe(false);

      service.setQuery('clio');
      service.setStatusFilter('done');
      service.setDateFrom('2026-01-01');
      service.setDateTo('2026-12-31');
      expect(service.hasActiveFilters()).toBe(true);

      service.clearFilters();
      expect(service.query()).toBe('');
      expect(service.statusFilter()).toBe('all');
      expect(service.dateFrom()).toBe('');
      expect(service.dateTo()).toBe('');
      expect(service.hasActiveFilters()).toBe(false);
      expect(service.filteredInterventions().length).toBe(service.count());
    });

    it('reports the empty state when no intervention exists', () => {
      for (const intervention of service.interventions()) {
        service.delete(intervention.id);
      }
      expect(service.isEmpty()).toBe(true);
      expect(service.hasInterventions()).toBe(false);
      expect(service.isNoResult()).toBe(false);
    });
  });
});
