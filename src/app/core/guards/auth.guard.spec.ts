import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, UrlTree } from '@angular/router';
import { authGuard, roleGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('route guards', () => {
  let auth: AuthService;
  let injector: Injector;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(AuthService);
    injector = TestBed.inject(Injector);
  });

  function run(
    guard: typeof authGuard,
    routeData: Record<string, unknown>,
    url: string
  ): ReturnType<typeof authGuard> {
    const route = { data: routeData } as unknown as ActivatedRouteSnapshot;
    return runInInjectionContext(injector, () => guard(route, { url } as never));
  }

  it('authGuard redirects unauthenticated users to login with returnUrl', () => {
    const result = run(authGuard, {}, '/parametres');
    expect(result instanceof UrlTree).toBe(true);
    const tree = result as UrlTree;
    const segments = tree.root.children['primary'].segments;
    expect(segments[0].path).toBe('auth');
    expect(segments[1].path).toBe('login');
    expect(tree.queryParams['returnUrl']).toBe('/parametres');
  });

  it('authGuard allows authenticated users', async () => {
    await auth.login('admin@example.com', 'admin1234');
    expect(run(authGuard, {}, '/parametres')).toBe(true);
  });

  it('roleGuard redirects unauthenticated users to login', () => {
    const result = run(roleGuard, { permission: 'settings:manage' }, '/parametres');
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).root.children['primary'].segments[1].path).toBe('login');
  });

  it('roleGuard denies authenticated users lacking the permission', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const result = run(roleGuard, { permission: 'settings:manage' }, '/parametres');
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).root.children['primary'].segments[0].path).toBe('acces-refuse');
  });

  it('roleGuard allows authenticated users with the permission', async () => {
    await auth.login('admin@example.com', 'admin1234');
    expect(run(roleGuard, { permission: 'settings:manage' }, '/parametres')).toBe(true);
  });

  it('roleGuard grants access when any listed permission is held', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const result = run(roleGuard, { permissions: ['clients:read', 'settings:manage'] }, '/parametres');
    expect(result).toBe(true);
  });
});
