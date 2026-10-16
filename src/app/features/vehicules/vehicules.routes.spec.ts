import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AuthService } from '../../core/services/auth.service';

/**
 * Routing + permission wiring for the vehicles domain.
 *
 * Both seeded roles hold `workshop:read` and `workshop:manage`, so a
 * write-denial cannot be demonstrated through a seeded account here. The
 * generic guard behaviour ("roleGuard denies authenticated users lacking the
 * permission") is covered by `core/guards/auth.guard.spec.ts`; these tests
 * verify the vehicles routes are mounted and guarded as intended.
 */
describe('vehicules routing integration', () => {
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
    await RouterTestingHarness.create('/vehicules');

    expect(router.url).toContain('/auth/login');
    expect(router.url).toContain('returnUrl=%2Fvehicules');
  });

  it('lets an employé read the vehicle list', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const harness = await RouterTestingHarness.create('/vehicules');

    expect(router.url).toBe('/vehicules');
    expect(harness.routeNativeElement?.textContent).toContain('AB-123-CD');
  });

  it('lets an employé read a vehicle detail', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const harness = await RouterTestingHarness.create('/vehicules/vehicle-1');

    expect(router.url).toBe('/vehicules/vehicle-1');
    expect(harness.routeNativeElement?.textContent).toContain('Renault');
  });

  it('lets an employé (holding workshop:manage) open the create form', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const harness = await RouterTestingHarness.create('/vehicules/nouveau');

    expect(router.url).toBe('/vehicules/nouveau');
    expect(harness.routeNativeElement?.textContent).toContain('Nouveau véhicule');
  });

  it('lets an administrateur open the edit form', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/vehicules/vehicle-1/modifier');

    expect(router.url).toBe('/vehicules/vehicle-1/modifier');
    expect(harness.routeNativeElement?.textContent).toContain('Modifier le véhicule');
  });
});
