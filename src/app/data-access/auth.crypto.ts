export function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && (window as any).crypto?.subtle) {
    return (window as any).crypto;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.subtle) {
    return (globalThis as any).crypto;
  }
  throw new Error('Web Crypto not available');
}

export async function generateSalt(): Promise<ArrayBuffer> {
  const salt = new Uint8Array(16);
  getCrypto().getRandomValues(salt);
  return salt.buffer;
}

export async function derivePasswordHash(password: string, salt: ArrayBuffer): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyMaterial = await getCrypto().subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await getCrypto().subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return derivedBits;
}

export async function derivePasswordHashFromSaltBytes(password: string, saltBytes: Uint8Array): Promise<Uint8Array> {
  const buf = await derivePasswordHash(password, saltBytes.buffer as ArrayBuffer);
  return new Uint8Array(buf);
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
