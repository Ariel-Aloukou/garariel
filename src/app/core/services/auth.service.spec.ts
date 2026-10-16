import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    service = TestBed.inject(AuthService);
  });

  it('should seed demo accounts for administrateur and employe', async () => {
    const login = await service.login('admin@example.com', 'admin1234');
    expect(login.success).toBe(true);
    expect(service.currentRole()).toBe('administrateur');
    service.logout();

    const staffLogin = await service.login('staff@example.com', 'staff1234');
    expect(staffLogin.success).toBe(true);
    expect(service.currentRole()).toBe('employe');
  });

  it('should register a new user with the employe role and reject duplicate identifier', async () => {
    const ok = await service.register('test@example.com', 'Password123', 'Password123');
    expect(ok.success).toBe(true);

    const login = await service.login('test@example.com', 'Password123');
    expect(login.success).toBe(true);
    expect(service.currentRole()).toBe('employe');

    const dup = await service.register('test@example.com', 'Password123', 'Password123');
    expect(dup.success).toBe(false);
  });

  it('should reject weak password and mismatched confirmation', async () => {
    const weak = await service.register('weak@example.com', 'short', 'short');
    expect(weak.success).toBe(false);

    const noDigit = await service.register('nodigit@example.com', 'abcdefgh', 'abcdefgh');
    expect(noDigit.success).toBe(false);

    const mismatch = await service.register('m@example.com', 'Password123', 'Password124');
    expect(mismatch.success).toBe(false);
  });

  it('should reject invalid credentials with a generic error', async () => {
    const bad = await service.login('admin@example.com', 'wrongpassword');
    expect(bad.success).toBe(false);
    expect(service.isAuthenticated()).toBe(false);

    const unknown = await service.login('nobody@example.com', 'Password123');
    expect(unknown.success).toBe(false);
  });

  it('should persist the session in localStorage and survive a reload', async () => {
    await service.login('admin@example.com', 'admin1234');
    expect(service.isAuthenticated()).toBe(true);

    const raw = localStorage.getItem('garariel.auth.session');
    expect(raw).toBeTruthy();

    // Simulate a reload by reinstantiating the service.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const reloaded = TestBed.inject(AuthService);
    expect(reloaded.isAuthenticated()).toBe(true);
    expect(reloaded.currentRole()).toBe('administrateur');
  });

  it('should log out and clear the persisted session', async () => {
    await service.login('admin@example.com', 'admin1234');
    service.clearSession();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('garariel.auth.session')).toBeNull();
  });

  it('should treat a corrupted or invalid session as logged out', async () => {
    localStorage.setItem('garariel.auth.session', '{ not valid json');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const corrupted = TestBed.inject(AuthService);
    expect(corrupted.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('garariel.auth.session')).toBeNull();

    // A well-formed but incomplete payload is also treated as logged out.
    localStorage.setItem('garariel.auth.session', JSON.stringify({ userId: 'admin-1' }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const incomplete = TestBed.inject(AuthService);
    expect(incomplete.isAuthenticated()).toBe(false);
  });

  it('should never store a plaintext password', async () => {
    await service.register('plain@example.com', 'SuperSecret1', 'SuperSecret1');
    const stored = localStorage.getItem('garariel.auth.users') ?? '';
    expect(stored).not.toContain('SuperSecret1');
    expect(stored).not.toContain('admin1234');
  });
});
