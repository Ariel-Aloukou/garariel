import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AuthService } from '../../core/services/auth.service';
import { AuthorizationService } from '../../core/services/authorization.service';
import { Login } from './login/login';
import { Register } from './register/register';

const SESSION_KEY = 'garariel.auth.session';
const USERS_KEY = 'garariel.auth.users';

/**
 * Verifies the login and register forms through the real router and DOM.
 *
 * The component specs call `onSubmit()` directly; these tests instead simulate a
 * real user: they type into the inputs (without blurring) and dispatch the form
 * `submit` event, which is exactly what pressing Enter does. They also assert the
 * unchanged permission and persistence behaviour.
 */
describe('auth forms (real UI integration: Enter submission, validation, persistence, permissions)', () => {
  let auth: AuthService;
  let authz: AuthorizationService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    auth = TestBed.inject(AuthService);
    authz = TestBed.inject(AuthorizationService);
    router = TestBed.inject(Router);
    await TestBed.compileComponents();
  });

  /** Types into a field and leaves it focused (no blur), like real typing. */
  function typeInto(root: HTMLElement, selector: string, value: string): void {
    const field = root.querySelector(selector) as HTMLInputElement;
    expect(field).toBeTruthy();
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  /** Implicit form submission, i.e. what pressing Enter inside a field triggers. */
  function submitWithEnter(root: HTMLElement): void {
    const form = root.querySelector('form') as HTMLFormElement;
    expect(form).toBeTruthy();
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  function clickSubmit(root: HTMLElement, text: string): void {
    const button = Array.from(root.querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(text)
    );
    expect(button).toBeTruthy();
    (button as HTMLButtonElement).click();
  }

  it('logs in on Enter (fields never blurred) and persists the session with its permissions', async () => {
    const harness = await RouterTestingHarness.create('/auth/login');
    const root = harness.routeNativeElement as HTMLElement;

    typeInto(root, '#identifier', 'admin@example.com');
    typeInto(root, '#password', 'admin1234');

    submitWithEnter(root);

    await vi.waitFor(() => expect(auth.isAuthenticated()).toBe(true));

    // Persisted like a normal login; no plaintext password ever stored.
    const raw = localStorage.getItem(SESSION_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).identifier).toBe('admin@example.com');
    expect(raw).not.toContain('admin1234');

    // Permissions follow the authenticated role, unchanged.
    expect(authz.hasPermission('clients:read')).toBe(true);
    expect(authz.hasPermission('settings:manage')).toBe(true);

    await vi.waitFor(() => expect(router.url).toBe('/'), { timeout: 3000 });
  });

  it('logs in through the normal submit button', async () => {
    const harness = await RouterTestingHarness.create('/auth/login');
    const root = harness.routeNativeElement as HTMLElement;

    typeInto(root, '#identifier', 'staff@example.com');
    typeInto(root, '#password', 'staff1234');

    clickSubmit(root, 'Se connecter');

    await vi.waitFor(() => expect(auth.isAuthenticated()).toBe(true));
    expect(authz.hasPermission('clients:read')).toBe(true);
    expect(authz.hasPermission('settings:manage')).toBe(false);
  });

  it('blocks an empty Enter submission and shows inline errors', async () => {
    const harness = await RouterTestingHarness.create('/auth/login');
    const root = harness.routeNativeElement as HTMLElement;

    submitWithEnter(root);
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(root.textContent).toContain("L'identifiant est requis");
    expect(root.textContent).toContain('Le mot de passe est requis');
  });

  it('rejects invalid credentials submitted with Enter', async () => {
    const harness = await RouterTestingHarness.create('/auth/login');
    const root = harness.routeNativeElement as HTMLElement;
    const login = harness.fixture.debugElement.query(By.directive(Login))?.componentInstance as Login;

    typeInto(root, '#identifier', 'nobody@example.com');
    typeInto(root, '#password', 'wrongpass');
    submitWithEnter(root);

    await vi.waitFor(() => expect(login.error()).not.toBeNull());
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    const alert = root.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain('invalide');
  });

  it('registers on Enter and persists an employe account without plaintext password', async () => {
    const harness = await RouterTestingHarness.create('/auth/register');
    const root = harness.routeNativeElement as HTMLElement;
    const register = harness.fixture.debugElement.query(By.directive(Register))
      ?.componentInstance as Register;

    typeInto(root, '#identifier', 'nouvelle.recrue@example.com');
    typeInto(root, '#password', 'Password123');
    typeInto(root, '#passwordConfirm', 'Password123');

    submitWithEnter(root);

    await vi.waitFor(() => expect(register.success()).not.toBeNull());

    const users = JSON.parse(localStorage.getItem(USERS_KEY) as string) as Array<{
      identifier: string;
      role: string;
    }>;
    const created = users.find((user) => user.identifier === 'nouvelle.recrue@example.com');
    expect(created).toBeTruthy();
    // Self-registration never grants administrateur.
    expect(created?.role).toBe('employe');
    expect(localStorage.getItem(USERS_KEY)).not.toContain('Password123');

    // The scheduled redirect runs, then the new account can log in with employe permissions.
    await vi.waitFor(() => expect(router.url).toBe('/auth/login'), { timeout: 3000 });

    await auth.login('nouvelle.recrue@example.com', 'Password123');
    expect(authz.hasPermission('clients:read')).toBe(true);
    expect(authz.hasPermission('settings:manage')).toBe(false);
  });

  it('registers through the normal submit button', async () => {
    const harness = await RouterTestingHarness.create('/auth/register');
    const root = harness.routeNativeElement as HTMLElement;
    const register = harness.fixture.debugElement.query(By.directive(Register))
      ?.componentInstance as Register;

    typeInto(root, '#identifier', 'clic.recrue@example.com');
    typeInto(root, '#password', 'Password123');
    typeInto(root, '#passwordConfirm', 'Password123');

    clickSubmit(root, 'Créer un compte');

    await vi.waitFor(() => expect(register.success()).not.toBeNull());
    expect(auth.isAuthenticated()).toBe(false); // registering does not open a session
  });

  it('blocks a weak password submitted with Enter and creates no account', async () => {
    const harness = await RouterTestingHarness.create('/auth/register');
    const root = harness.routeNativeElement as HTMLElement;

    // Wait for the seed to be persisted so the count is meaningful.
    await vi.waitFor(() => expect(localStorage.getItem(USERS_KEY)).not.toBeNull());
    const before = (JSON.parse(localStorage.getItem(USERS_KEY) as string) as unknown[]).length;

    typeInto(root, '#identifier', 'motdepasse.faible@example.com');
    typeInto(root, '#password', 'weak');
    typeInto(root, '#passwordConfirm', 'weak');

    submitWithEnter(root);
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    const after = JSON.parse(localStorage.getItem(USERS_KEY) as string) as unknown[];
    expect(after.length).toBe(before);
    expect(localStorage.getItem(USERS_KEY)).not.toContain('motdepasse.faible@example.com');
    expect(root.textContent).toContain('Au moins 8 caractères');
  });

  it('reports a mismatched confirmation submitted with Enter', async () => {
    const harness = await RouterTestingHarness.create('/auth/register');
    const root = harness.routeNativeElement as HTMLElement;
    const register = harness.fixture.debugElement.query(By.directive(Register))
      ?.componentInstance as Register;

    typeInto(root, '#identifier', 'confirmation@example.com');
    typeInto(root, '#password', 'Password123');
    typeInto(root, '#passwordConfirm', 'Password124');

    submitWithEnter(root);

    await vi.waitFor(() => expect(register.error()).not.toBeNull());
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    const alert = root.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain('confirmation');
  });
});
