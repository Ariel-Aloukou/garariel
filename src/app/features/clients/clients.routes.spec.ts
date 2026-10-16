import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AuthService } from '../../core/services/auth.service';

describe('clients routing integration', () => {
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
    await RouterTestingHarness.create('/clients');

    expect(router.url).toContain('/auth/login');
    expect(router.url).toContain('returnUrl=%2Fclients');
  });

  it('lets an employé read the client list but refuses the write routes', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const harness = await RouterTestingHarness.create('/clients');

    expect(router.url).toBe('/clients');
    expect(harness.routeNativeElement?.textContent).toContain('Camille Durand');

    await harness.navigateByUrl('/clients/nouveau');
    expect(router.url).toBe('/acces-refuse');
  });

  it('lets an employé read a client detail and refuses the edit route', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const harness = await RouterTestingHarness.create('/clients/client-1');

    expect(router.url).toBe('/clients/client-1');
    expect(harness.routeNativeElement?.textContent).toContain('Camille Durand');

    await harness.navigateByUrl('/clients/client-1/modifier');
    expect(router.url).toBe('/acces-refuse');
  });

  it('lets an administrateur open the create form', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/clients/nouveau');

    expect(router.url).toBe('/clients/nouveau');
    expect(harness.routeNativeElement?.textContent).toContain('Nouveau client');
  });
});
