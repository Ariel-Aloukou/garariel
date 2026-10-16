import { Client } from './client.models';

const CLIENTS_KEY = 'garariel.clients';

/** Fixed timestamp so the demo seed is deterministic across runs and tests. */
const SEED_TIMESTAMP = 1_700_000_000_000;

function isValidClient(value: unknown): value is Client {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'string' &&
    typeof candidate['fullName'] === 'string' &&
    typeof candidate['phone'] === 'string' &&
    typeof candidate['email'] === 'string' &&
    (candidate['address'] === undefined || typeof candidate['address'] === 'string') &&
    typeof candidate['createdAt'] === 'number' &&
    typeof candidate['updatedAt'] === 'number'
  );
}

/** Reads stored clients. Returns `null` when nothing usable is stored (missing or unreadable). */
export function loadClients(): Client[] | null {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    // Keep only well-formed entries; an empty array stays empty (do not reseed).
    return parsed.filter(isValidClient);
  } catch {
    return null;
  }
}

export function saveClients(clients: Client[]): void {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

/** Deterministic demo clients used for development and tests. */
export function buildSeedClients(): Client[] {
  return [
    {
      id: 'client-1',
      fullName: 'Camille Durand',
      phone: '+33 6 12 34 56 78',
      email: 'camille.durand@example.com',
      address: '12 rue des Lilas, 75011 Paris',
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: 'client-2',
      fullName: 'Léa Moreau',
      phone: '06 98 76 54 32',
      email: 'lea.moreau@example.com',
      address: '5 avenue Victor Hugo, 69006 Lyon',
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: 'client-3',
      fullName: 'Karim Benali',
      phone: '07 11 22 33 44',
      email: 'karim.benali@example.com',
      address: '',
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];
}

/** Returns stored clients when present, otherwise seeds deterministic demo data. */
export function loadOrSeedClients(): Client[] {
  const existing = loadClients();
  if (existing !== null) return existing;
  const seeded = buildSeedClients();
  saveClients(seeded);
  return seeded;
}
