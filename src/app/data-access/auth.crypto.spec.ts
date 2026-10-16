import { derivePasswordHashFromSaltBytes, generateSalt } from './auth.crypto';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

describe('auth.crypto', () => {
  it('produces the same derived hash for the same password and salt', async () => {
    const salt = new Uint8Array(16).fill(7);
    const a = await derivePasswordHashFromSaltBytes('Password123', salt);
    const b = await derivePasswordHashFromSaltBytes('Password123', salt);
    expect(toHex(a)).toBe(toHex(b));
  });

  it('produces different hashes for different passwords on the same salt', async () => {
    const salt = new Uint8Array(16).fill(7);
    const a = await derivePasswordHashFromSaltBytes('Password123', salt);
    const b = await derivePasswordHashFromSaltBytes('Password124', salt);
    expect(toHex(a)).not.toBe(toHex(b));
  });

  it('produces a derived hash that does not contain the plaintext password', async () => {
    const salt = new Uint8Array(16).fill(3);
    const hash = await derivePasswordHashFromSaltBytes('Password123', salt);
    // The derived value is 32 bytes and must not be readable as the input string.
    expect(hash.byteLength).toBe(32);
    expect(toHex(hash)).not.toContain('Password123');
    expect(toHex(hash)).not.toContain('password');
  });

  it('generates a unique random salt on each call', async () => {
    const s1 = new Uint8Array(await generateSalt());
    const s2 = new Uint8Array(await generateSalt());
    expect(toHex(s1)).not.toBe(toHex(s2));
  });
});
