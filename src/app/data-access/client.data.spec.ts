import { buildSeedClients, loadClients, loadOrSeedClients, saveClients } from './client.data';
import { Client } from './client.models';

const CLIENTS_KEY = 'garariel.clients';

function sampleClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'client-x',
    fullName: 'Test Client',
    phone: '0600000000',
    email: 'test@example.com',
    address: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe('client.data', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no clients are stored', () => {
    expect(loadClients()).toBeNull();
  });

  it('returns null when stored data is unreadable', () => {
    localStorage.setItem(CLIENTS_KEY, '{ not valid json');
    expect(loadClients()).toBeNull();
  });

  it('returns null when stored data is not an array', () => {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify({ not: 'an array' }));
    expect(loadClients()).toBeNull();
  });

  it('drops incomplete entries and keeps well-formed ones', () => {
    const valid = sampleClient();
    localStorage.setItem(CLIENTS_KEY, JSON.stringify([valid, { id: 'broken' }, null, 42]));
    expect(loadClients()).toEqual([valid]);
  });

  it('keeps an explicitly empty list empty instead of reseeding', () => {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify([]));
    expect(loadClients()).toEqual([]);
    expect(loadOrSeedClients()).toEqual([]);
  });

  it('round-trips clients through localStorage', () => {
    const clients = [sampleClient(), sampleClient({ id: 'client-y', fullName: 'Autre' })];
    saveClients(clients);
    expect(loadClients()).toEqual(clients);
  });

  it('builds a deterministic seed', () => {
    expect(buildSeedClients()).toEqual(buildSeedClients());
    expect(buildSeedClients().length).toBeGreaterThan(0);
  });

  it('seeds and persists deterministic data when storage is empty', () => {
    const clients = loadOrSeedClients();
    expect(clients).toEqual(buildSeedClients());
    expect(loadClients()).toEqual(clients);
  });

  it('returns already stored clients without reseeding', () => {
    const stored = [sampleClient({ id: 'client-stored' })];
    saveClients(stored);
    expect(loadOrSeedClients()).toEqual(stored);
  });
});
