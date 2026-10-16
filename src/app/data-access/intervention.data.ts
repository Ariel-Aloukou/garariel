import { Intervention, InterventionStatus } from './intervention.models';

const INTERVENTIONS_KEY = 'garariel.interventions';

/** Fixed timestamp so the demo seed is deterministic across runs and tests. */
const SEED_TIMESTAMP = 1_700_000_000_000;

const STATUSES: InterventionStatus[] = ['pending', 'in_progress', 'done'];

function isValidStatus(value: unknown): value is InterventionStatus {
  return typeof value === 'string' && (STATUSES as string[]).includes(value);
}

function isValidIntervention(value: unknown): value is Intervention {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'string' &&
    typeof candidate['vehicleId'] === 'string' &&
    typeof candidate['date'] === 'string' &&
    typeof candidate['problem'] === 'string' &&
    (candidate['diagnosis'] === undefined || typeof candidate['diagnosis'] === 'string') &&
    (candidate['workDone'] === undefined || typeof candidate['workDone'] === 'string') &&
    (candidate['cost'] === undefined || typeof candidate['cost'] === 'number') &&
    isValidStatus(candidate['status']) &&
    typeof candidate['createdAt'] === 'number' &&
    typeof candidate['updatedAt'] === 'number'
  );
}

/** Reads stored interventions. Returns `null` when nothing usable is stored (missing or unreadable). */
export function loadInterventions(): Intervention[] | null {
  try {
    const raw = localStorage.getItem(INTERVENTIONS_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    // Keep only well-formed entries; an empty array stays empty (do not reseed).
    return parsed.filter(isValidIntervention);
  } catch {
    return null;
  }
}

export function saveInterventions(interventions: Intervention[]): void {
  localStorage.setItem(INTERVENTIONS_KEY, JSON.stringify(interventions));
}

/** Deterministic demo interventions used for development and tests (vehicles match the vehicle seed). */
export function buildSeedInterventions(): Intervention[] {
  return [
    {
      id: 'intervention-1',
      vehicleId: 'vehicle-1',
      date: '2026-09-15',
      problem: 'Bruit anormal au freinage.',
      diagnosis: 'Plaquettes de frein avant usées.',
      workDone: 'Remplacement des plaquettes de frein avant.',
      cost: 189.9,
      status: 'done',
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: 'intervention-2',
      vehicleId: 'vehicle-2',
      date: '2026-10-02',
      problem: 'Voyant moteur allumé.',
      diagnosis: 'Sonde lambda défectueuse.',
      status: 'in_progress',
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: 'intervention-3',
      vehicleId: 'vehicle-3',
      date: '2026-10-14',
      problem: 'Révision des 40 000 km.',
      status: 'pending',
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];
}

/** Returns stored interventions when present, otherwise seeds deterministic demo data. */
export function loadOrSeedInterventions(): Intervention[] {
  const existing = loadInterventions();
  if (existing !== null) return existing;
  const seeded = buildSeedInterventions();
  saveInterventions(seeded);
  return seeded;
}
