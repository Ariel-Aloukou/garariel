import { Vehicle } from './vehicle.models';

const VEHICLES_KEY = 'garariel.vehicles';

/** Fixed timestamp so the demo seed is deterministic across runs and tests. */
const SEED_TIMESTAMP = 1_700_000_000_000;

function isValidVehicle(value: unknown): value is Vehicle {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'string' &&
    typeof candidate['plate'] === 'string' &&
    typeof candidate['make'] === 'string' &&
    typeof candidate['model'] === 'string' &&
    (candidate['year'] === undefined || typeof candidate['year'] === 'number') &&
    typeof candidate['clientId'] === 'string' &&
    typeof candidate['createdAt'] === 'number' &&
    typeof candidate['updatedAt'] === 'number'
  );
}

/** Reads stored vehicles. Returns `null` when nothing usable is stored (missing or unreadable). */
export function loadVehicles(): Vehicle[] | null {
  try {
    const raw = localStorage.getItem(VEHICLES_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    // Keep only well-formed entries; an empty array stays empty (do not reseed).
    return parsed.filter(isValidVehicle);
  } catch {
    return null;
  }
}

export function saveVehicles(vehicles: Vehicle[]): void {
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
}

/** Deterministic demo vehicles used for development and tests (owner ids match the client seed). */
export function buildSeedVehicles(): Vehicle[] {
  return [
    {
      id: 'vehicle-1',
      plate: 'AB-123-CD',
      make: 'Renault',
      model: 'Clio',
      year: 2019,
      clientId: 'client-1',
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: 'vehicle-2',
      plate: 'EF-456-GH',
      make: 'Citroën',
      model: 'C4',
      year: 2021,
      clientId: 'client-2',
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: 'vehicle-3',
      plate: 'IJ-789-KL',
      make: 'Toyota',
      model: 'Yaris',
      clientId: 'client-3',
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];
}

/** Returns stored vehicles when present, otherwise seeds deterministic demo data. */
export function loadOrSeedVehicles(): Vehicle[] {
  const existing = loadVehicles();
  if (existing !== null) return existing;
  const seeded = buildSeedVehicles();
  saveVehicles(seeded);
  return seeded;
}
