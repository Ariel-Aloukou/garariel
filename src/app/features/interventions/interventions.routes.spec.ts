import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AuthService } from '../../core/services/auth.service';

/**
 * Routing and permission control for the interventions domain.
 *
 * Both seeded roles already hold `workshop:read`/`workshop:manage`, so the
 * permission matrix itself is covered by the guard spec; here we verify the
 * routes are mounted, lazy-loaded and protected like the other domains.
 */
describe('interventions routes', () => {
  let auth: AuthService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    await TestBed.compileComponents();
  });

  it('redirects an unauthenticated user to the login screen', async () => {
    await RouterTestingHarness.create('/interventions');

    expect(router.url).toContain('/auth/login');
    expect(router.url).toContain('returnUrl=%2Finterventions');
  });

  it('lets an employé read the intervention list', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const harness = await RouterTestingHarness.create('/interventions');

    expect(router.url).toBe('/interventions');
    expect(harness.routeNativeElement?.textContent).toContain('AB-123-CD');
  });

  it('lets an employé read an intervention detail', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const harness = await RouterTestingHarness.create('/interventions/intervention-1');

    expect(router.url).toBe('/interventions/intervention-1');
    expect(harness.routeNativeElement?.textContent).toContain('Bruit anormal au freinage.');
  });

  it('lets an employé (holding workshop:manage) open the create form', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const harness = await RouterTestingHarness.create('/interventions/nouveau');

    expect(router.url).toBe('/interventions/nouveau');
    expect(harness.routeNativeElement?.textContent).toContain('Nouvelle intervention');
  });

  it('lets an administrateur open the edit form', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/interventions/intervention-1/modifier');

    expect(router.url).toBe('/interventions/intervention-1/modifier');
    expect(harness.routeNativeElement?.textContent).toContain("Modifier l'intervention");
  });
});
