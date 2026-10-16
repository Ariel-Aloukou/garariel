import { UserAccount } from './auth.models';
import { arrayBufferToBase64, derivePasswordHashFromSaltBytes, generateSalt } from './auth.crypto';

const USERS_KEY = 'garariel.auth.users';

function toBase64(bytes: Uint8Array): string {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return arrayBufferToBase64(copy.buffer as ArrayBuffer);
}

async function buildSeedUsers(): Promise<UserAccount[]> {
  const adminSalt = await generateSalt();
  const staffSalt = await generateSalt();
  const adminHash = await derivePasswordHashFromSaltBytes('admin1234', new Uint8Array(adminSalt));
  const staffHash = await derivePasswordHashFromSaltBytes('staff1234', new Uint8Array(staffSalt));

  return [
    {
      id: 'admin-1',
      identifier: 'admin@example.com',
      passwordHash: toBase64(adminHash),
      passwordSalt: arrayBufferToBase64(adminSalt),
      role: 'administrateur',
      createdAt: Date.now(),
    },
    {
      id: 'staff-1',
      identifier: 'staff@example.com',
      passwordHash: toBase64(staffHash),
      passwordSalt: arrayBufferToBase64(staffSalt),
      role: 'employe',
      createdAt: Date.now(),
    },
  ];
}

export function loadUsers(): UserAccount[] | null {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed as UserAccount[];
  } catch {
    return null;
  }
}

export function saveUsers(users: UserAccount[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function loadOrSeedUsers(): Promise<UserAccount[]> {
  const existing = loadUsers();
  if (existing) return existing;
  const seeded = await buildSeedUsers();
  saveUsers(seeded);
  return seeded;
}
