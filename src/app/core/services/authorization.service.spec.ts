import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthorizationService } from './authorization.service';

describe('AuthorizationService', () => {
  let auth: AuthService;
  let authz: AuthorizationService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(AuthService);
    authz = TestBed.inject(AuthorizationService);
  });

  it('should deny every permission when unauthenticated', () => {
    expect(authz.permissions()).toEqual([]);
    expect(authz.hasPermission('clients:read')).toBe(false);
  });

  it('should grant the employe role limited permissions', async () => {
    await auth.login('staff@example.com', 'staff1234');
    expect(authz.hasPermission('clients:read')).toBe(true);
    expect(authz.hasPermission('workshop:manage')).toBe(true);
    expect(authz.hasPermission('factures:manage')).toBe(false);
    expect(authz.hasPermission('settings:manage')).toBe(false);
  });

  it('should grant the administrateur role broader permissions than employe', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const staffPerms = [...authz.permissions()];
    auth.clearSession();

    await auth.login('admin@example.com', 'admin1234');
    const adminPerms = [...authz.permissions()];

    expect(authz.hasPermission('settings:manage')).toBe(true);
    expect(authz.hasPermission('factures:manage')).toBe(true);
    expect(adminPerms.length).toBeGreaterThan(staffPerms.length);
  });

  it('should support hasAnyPermission and hasAllPermissions checks', async () => {
    await auth.login('staff@example.com', 'staff1234');
    expect(authz.hasAnyPermission(['clients:read', 'settings:manage'])).toBe(true);
    expect(authz.hasAllPermissions(['clients:read', 'settings:manage'])).toBe(false);
    expect(authz.hasAllPermissions(['clients:read', 'workshop:read'])).toBe(true);
  });
});
