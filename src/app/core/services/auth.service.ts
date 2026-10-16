import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session, UserAccount } from '../../data-access/auth.models';
import { arrayBufferToBase64, base64ToUint8Array, derivePasswordHashFromSaltBytes, generateSalt } from '../../data-access/auth.crypto';
import { loadOrSeedUsers, saveUsers } from '../../data-access/auth.data';

const SESSION_KEY = 'garariel.auth.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);

  private readonly _users = signal<UserAccount[]>([]);
  private readonly _session = signal<Session | null>(null);
  private readonly usersReady: Promise<void>;

  readonly users = this._users.asReadonly();
  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);
  readonly currentUserId = computed(() => this._session()?.userId ?? null);
  readonly currentRole = computed(() => this._session()?.role ?? null);
  readonly currentIdentifier = computed(() => this._session()?.identifier ?? null);

  constructor() {
    this.restoreSession();
    this.usersReady = this.initUsers();
  }

  private async initUsers(): Promise<void> {
    const users = await loadOrSeedUsers();
    this._users.set(users);
  }

  private restoreSession(): void {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Session>;
      if (
        parsed &&
        typeof parsed.userId === 'string' &&
        (parsed.role === 'administrateur' || parsed.role === 'employe') &&
        typeof parsed.identifier === 'string' &&
        typeof parsed.issuedAt === 'number'
      ) {
        this._session.set({
          userId: parsed.userId,
          role: parsed.role,
          identifier: parsed.identifier,
          issuedAt: parsed.issuedAt,
        });
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  private persistSession(session: Session | null): void {
    if (session === null) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private async hashPassword(password: string, saltBytes: Uint8Array): Promise<string> {
    const hash = await derivePasswordHashFromSaltBytes(password, saltBytes);
    const copy = new Uint8Array(hash.byteLength);
    copy.set(hash);
    return arrayBufferToBase64(copy.buffer as ArrayBuffer);
  }

  async register(
    identifier: string,
    password: string,
    passwordConfirm: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!identifier || !password || !passwordConfirm) {
      return { success: false, error: 'Tous les champs sont requis' };
    }
    if (password.length < 8) {
      return { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' };
    }
    const hasLetter = /[A-Za-z]/.test(password);
    const hasDigit = /\d/.test(password);
    if (!hasLetter || !hasDigit) {
      return { success: false, error: 'Le mot de passe doit contenir au moins une lettre et un chiffre' };
    }
    if (password !== passwordConfirm) {
      return { success: false, error: 'La confirmation du mot de passe ne correspond pas' };
    }

    await this.usersReady;
    const normalized = identifier.trim().toLowerCase();
    if (this._users().some((u) => u.identifier.toLowerCase() === normalized)) {
      return { success: false, error: 'Cet identifiant est déjà utilisé' };
    }

    const saltBuffer = await generateSalt();
    const saltBytes = new Uint8Array(saltBuffer);
    const hash = await this.hashPassword(password, saltBytes);
    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      identifier: identifier.trim(),
      passwordHash: hash,
      passwordSalt: arrayBufferToBase64(saltBuffer),
      role: 'employe',
      createdAt: Date.now(),
    };

    this._users.update((users) => {
      const next = [...users, newUser];
      saveUsers(next);
      return next;
    });
    return { success: true };
  }

  async login(identifier: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!identifier || !password) {
      return { success: false, error: 'Identifiant et mot de passe requis' };
    }

    await this.usersReady;
    const normalized = identifier.trim().toLowerCase();
    const user = this._users().find((u) => u.identifier.toLowerCase() === normalized);
    if (!user) {
      return { success: false, error: 'Identifiant ou mot de passe invalide' };
    }

    const saltBytes = base64ToUint8Array(user.passwordSalt);
    const hash = await this.hashPassword(password, saltBytes);
    if (hash !== user.passwordHash) {
      return { success: false, error: 'Identifiant ou mot de passe invalide' };
    }

    const session: Session = {
      userId: user.id,
      role: user.role,
      identifier: user.identifier,
      issuedAt: Date.now(),
    };
    this._session.set(session);
    this.persistSession(session);
    return { success: true };
  }

  logout(): void {
    this._session.set(null);
    this.persistSession(null);
    void this.router.navigate(['/auth/login']).catch(() => {
      /* navigation is best-effort; the session is already cleared */
    });
  }

  clearSession(): void {
    this._session.set(null);
    this.persistSession(null);
  }
}
