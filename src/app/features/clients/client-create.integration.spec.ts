import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AuthService } from '../../core/services/auth.service';
import { ClientService } from '../../core/services/client.service';
import { loadClients } from '../../data-access/client.data';

const CLIENTS_KEY = 'garariel.clients';

/**
 * Verifies the "add a client" journey through the real router, guards and DOM:
 * the list action, the /clients/nouveau route, permissions, form validation and
 * persistence in localStorage. Unlike the component specs, this fills the real
 * inputs and clicks the real submit button instead of calling `onSubmit()`.
 */
describe('client creation (real UI integration)', () => {
  let auth: AuthService;
  let clients: ClientService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    auth = TestBed.inject(AuthService);
    clients = TestBed.inject(ClientService);
    router = TestBed.inject(Router);
    await TestBed.compileComponents();
  });

  function typeInto(
    root: HTMLElement,
    selector: string,
    value: string
  ): void {
    const field = root.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
    expect(field).toBeTruthy();
    field.value = value;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));
  }

  function findButton(root: HTMLElement, text: string): HTMLButtonElement {
    const button = Array.from(root.querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(text)
    );
    expect(button).toBeTruthy();
    return button as HTMLButtonElement;
  }

  it('exposes the "Nouveau client" action but only to a writer', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const staffHarness = await RouterTestingHarness.create('/clients');
    const staffRoot = staffHarness.routeNativeElement as HTMLElement;
    expect(staffRoot.textContent).not.toContain('Nouveau client');

    await auth.login('admin@example.com', 'admin1234');
    staffHarness.fixture.detectChanges();
    const adminRoot = staffHarness.routeNativeElement as HTMLElement;
    const newLink = Array.from(adminRoot.querySelectorAll('a')).find((link) =>
      link.textContent?.includes('Nouveau client')
    );
    expect(newLink).toBeTruthy();
    expect(newLink?.getAttribute('href')).toBe('/clients/nouveau');
  });

  it('creates a client through the form inputs and persists it in localStorage', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/clients/nouveau');
    const root = harness.routeNativeElement as HTMLElement;

    expect(root.textContent).toContain('Nouveau client');
    expect(router.url).toBe('/clients/nouveau');

    typeInto(root, '#client-fullName', 'Nouvelle Cliente');
    typeInto(root, '#client-phone', '06 55 44 33 22');
    typeInto(root, '#client-email', 'nouvelle.cliente@example.com');
    typeInto(root, '#client-address', '1 rue du Test, 75001 Paris');

    findButton(root, 'Créer le client').click();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    const created = clients.clients().find((c) => c.email === 'nouvelle.cliente@example.com');
    expect(created).toBeTruthy();
    expect(created?.fullName).toBe('Nouvelle Cliente');
    expect(created?.address).toBe('1 rue du Test, 75001 Paris');

    // Persisted under the prototype key and readable back.
    const raw = localStorage.getItem(CLIENTS_KEY);
    expect(raw).toBeTruthy();
    expect(raw).toContain('nouvelle.cliente@example.com');
    expect(loadClients()?.some((c) => c.id === created!.id)).toBe(true);

    // The form reports success and schedules the redirect to the new detail page.
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('créé');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await harness.fixture.whenStable();
    expect(router.url).toBe(`/clients/${created!.id}`);
    expect(harness.routeNativeElement?.textContent).toContain('Nouvelle Cliente');
  });

  it('submits when the user presses Enter without leaving the field', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/clients/nouveau');
    const root = harness.routeNativeElement as HTMLElement;
    const before = clients.count();

    // Type without blurring: pressing Enter performs an implicit form submit
    // while the field keeps focus (so no 'blur' fires).
    const type = (selector: string, value: string): void => {
      const field = root.querySelector(selector) as HTMLInputElement;
      field.value = value;
      field.dispatchEvent(new Event('input'));
    };
    type('#client-fullName', 'Client Entrée');
    type('#client-phone', '06 11 22 33 44');
    type('#client-email', 'entree@example.com');

    (root.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(clients.count()).toBe(before + 1);
    expect(clients.clients().some((c) => c.email === 'entree@example.com')).toBe(true);
  });

  it('blocks an invalid submission and does not persist anything', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/clients/nouveau');
    const root = harness.routeNativeElement as HTMLElement;
    const before = clients.count();

    typeInto(root, '#client-fullName', 'Sans Email');
    typeInto(root, '#client-phone', '06 00 00 00 00');
    typeInto(root, '#client-email', 'pas-un-email');

    findButton(root, 'Créer le client').click();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(clients.count()).toBe(before);
    expect(clients.clients().some((c) => c.fullName === 'Sans Email')).toBe(false);
    expect(root.querySelector('[role="alert"]')).toBeTruthy();
    expect(router.url).toBe('/clients/nouveau');
  });

  it('refuses the create route to a role without clients:write', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const harness = await RouterTestingHarness.create('/clients/nouveau');

    expect(router.url).toBe('/acces-refuse');
    expect(harness.routeNativeElement?.textContent).not.toContain('Créer le client');
  });
});
