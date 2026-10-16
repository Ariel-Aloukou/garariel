import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AuthService } from '../../core/services/auth.service';
import { ClientService } from '../../core/services/client.service';
import { ClientForm } from './client-form/client-form';
import { ClientDetail } from './client-detail/client-detail';

/**
 * End-to-end control through the real router + guards.
 *
 * No desktop browser/viewport is available in this environment, so the
 * lifecycle, not-found state and keyboard reachability are exercised through
 * the Angular RouterTestingHarness instead of manual pixel-level checks.
 */
describe('clients end-to-end control', () => {
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

  it('creates, searches, views, edits and deletes a client', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/clients');
    const fixture = harness.fixture;

    // 1. Create
    await harness.navigateByUrl('/clients/nouveau');
    const form = harness.fixture.debugElement.query(By.directive(ClientForm))
      ?.componentInstance as ClientForm;
    expect(form).toBeTruthy();
    form.form.setValue({
      fullName: 'Zoé Test',
      phone: '06 11 22 33 44',
      email: 'zoe.test@example.com',
      address: '2 rue des Tests',
    });
    await form.onSubmit();
    fixture.detectChanges();

    const created = clients.clients().find((client) => client.email === 'zoe.test@example.com');
    expect(created).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('créé');

    // The form redirects to the new client's detail.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await fixture.whenStable();
    expect(router.url).toBe(`/clients/${created!.id}`);

    // 2. Search from the list
    await harness.navigateByUrl('/clients');
    clients.setQuery('zoe');
    fixture.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Zoé Test');
    expect(harness.routeNativeElement?.textContent).not.toContain('Camille Durand');
    clients.clearQuery();

    // 3. View the detail
    await harness.navigateByUrl(`/clients/${created!.id}`);
    expect(harness.routeNativeElement?.textContent).toContain('zoe.test@example.com');
    expect(harness.routeNativeElement?.textContent).toContain('2 rue des Tests');

    // 4. Edit
    await harness.navigateByUrl(`/clients/${created!.id}/modifier`);
    const editForm = harness.fixture.debugElement.query(By.directive(ClientForm))
      ?.componentInstance as ClientForm;
    editForm.form.controls.fullName.setValue('Zoé Modifiée');
    await editForm.onSubmit();
    fixture.detectChanges();
    expect(clients.getById(created!.id)?.fullName).toBe('Zoé Modifiée');

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await fixture.whenStable();
    expect(router.url).toBe(`/clients/${created!.id}`);
    expect(harness.routeNativeElement?.textContent).toContain('Zoé Modifiée');

    // 5. Delete with explicit confirmation
    const detail = harness.fixture.debugElement.query(By.directive(ClientDetail))
      ?.componentInstance as ClientDetail;
    detail.requestDelete();
    fixture.detectChanges();
    expect(detail.confirming()).toBe(true);
    expect(clients.getById(created!.id)).toBeTruthy();

    detail.confirmDelete();
    fixture.detectChanges();
    expect(clients.getById(created!.id)).toBeUndefined();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('supprimé');

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await fixture.whenStable();
    expect(router.url).toBe('/clients');
  });

  it('shows a not-found state for an unknown client id', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const harness = await RouterTestingHarness.create('/clients/unknown-id');

    expect(router.url).toBe('/clients/unknown-id');
    expect(harness.routeNativeElement?.textContent).toContain('introuvable');
  });

  it('associates every form field with a label for keyboard and screen-reader access', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/clients/nouveau');
    const root = harness.routeNativeElement as HTMLElement;

    const fields = Array.from(root.querySelectorAll('input, textarea'));
    expect(fields.length).toBeGreaterThan(0);
    for (const field of fields) {
      expect(field.id).toBeTruthy();
      expect(root.querySelector(`label[for="${field.id}"]`)).toBeTruthy();
      expect(field.getAttribute('tabindex')).not.toBe('-1');
    }
  });
});
