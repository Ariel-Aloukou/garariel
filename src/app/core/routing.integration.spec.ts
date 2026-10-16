import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { AuthService } from './services/auth.service';
import { Login } from '../features/auth/login/login';
import { Register } from '../features/auth/register/register';

describe('app routing integration', () => {
  let auth: AuthService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    await TestBed.compileComponents();
  });

  it('redirects unauthenticated users to login and remembers the requested URL', async () => {
    const harness = await RouterTestingHarness.create('/parametres');

    expect(router.url).toContain('/auth/login');
    expect(router.url).toContain('returnUrl=%2Fparametres');
    expect(harness.routeNativeElement?.textContent).toContain('Connexion');
  });

  it('returns to the protected route after a successful login', async () => {
    const harness = await RouterTestingHarness.create('/parametres');
    expect(router.url).toContain('/auth/login');

    const loginDebug = harness.routeDebugElement;
    const login = loginDebug?.componentInstance as Login | undefined;
    expect(login).toBeTruthy();

    login!.form.setValue({ identifier: 'admin@example.com', password: 'admin1234' });
    await login!.onSubmit();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/parametres');
    expect(harness.routeNativeElement?.textContent).toContain('Espace réservé');
  });

  it('allows an authenticated administrateur into a permission-protected route', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/parametres');

    expect(router.url).toBe('/parametres');
    expect(harness.routeNativeElement?.textContent).toContain('settings:manage');
  });

  it('sends an authenticated employé to the access-denied view', async () => {
    await auth.login('staff@example.com', 'staff1234');
    await RouterTestingHarness.create('/parametres');

    expect(router.url).toBe('/acces-refuse');
  });

  it('lets the shell render with a nested home view for an authenticated user', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const harness = await RouterTestingHarness.create('/');

    expect(router.url).toBe('/');
    expect(harness.routeNativeElement?.textContent).toContain('Tableau de bord');
  });

  it('runs the full connect → access → logout → re-protect flow (task 4.4)', async () => {
    // 1. Direct access to a protected URL without any session.
    const harness = await RouterTestingHarness.create('/parametres');
    expect(router.url).toContain('/auth/login');
    expect(router.url).toContain('returnUrl=%2Fparametres');

    // 2. Log in as the employé through the rendered login form.
    const login = harness.routeDebugElement?.componentInstance as Login | undefined;
    expect(login).toBeTruthy();
    login!.form.setValue({ identifier: 'staff@example.com', password: 'staff1234' });
    await login!.onSubmit();
    await harness.fixture.whenStable();
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.currentRole()).toBe('employe');

    // 3. The employé is refused on the admin-only route.
    await harness.navigateByUrl('/parametres');
    expect(router.url).toBe('/acces-refuse');

    // 4. Logout clears the session and the persisted value.
    auth.logout();
    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('garariel.auth.session')).toBeNull();

    // 5. The protected URL is protected again after logout.
    await harness.navigateByUrl('/parametres');
    expect(router.url).toContain('/auth/login');
  });

  it('registers a new employé through the form and refuses the admin route (task 4.4)', async () => {
    // Registration through the rendered form creates an Employé-only account.
    const harness = await RouterTestingHarness.create('/auth/register');
    const register = harness.routeDebugElement?.componentInstance as Register | undefined;
    expect(register).toBeTruthy();

    register!.form.setValue({
      identifier: 'nouvel.employe@example.com',
      password: 'motdepasse1',
      passwordConfirm: 'motdepasse1',
    });
    await register!.onSubmit();
    await harness.fixture.whenStable();
    expect(register!.success()).toContain('Compte créé');

    // The freshly created account can open a session and is an Employé.
    const login = await auth.login('nouvel.employe@example.com', 'motdepasse1');
    expect(login.success).toBe(true);
    expect(auth.currentRole()).toBe('employe');

    // The new Employé is refused on the administrateur-only route.
    await harness.navigateByUrl('/parametres');
    expect(router.url).toBe('/acces-refuse');
  });

  it('reconnects an administrateur from a persisted session across a reload', async () => {
    await auth.login('admin@example.com', 'admin1234');
    expect(auth.isAuthenticated()).toBe(true);

    // Simulate a full reload: fresh TestBed, same localStorage session.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const reloadedAuth = TestBed.inject(AuthService);
    const reloadedRouter = TestBed.inject(Router);
    expect(reloadedAuth.isAuthenticated()).toBe(true);

    const harness = await RouterTestingHarness.create('/parametres');
    expect(reloadedRouter.url).toBe('/parametres');
    expect(harness.routeNativeElement?.textContent).toContain('settings:manage');
  });
});
