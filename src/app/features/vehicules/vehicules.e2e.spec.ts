import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AuthService } from '../../core/services/auth.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { VehicleForm } from './vehicle-form/vehicle-form';
import { VehicleDetail } from './vehicle-detail/vehicle-detail';

/**
 * End-to-end control through the real router + guards.
 *
 * No desktop browser/viewport is available in this environment, so the
 * lifecycle, not-found state and keyboard reachability are exercised through
 * the Angular RouterTestingHarness instead of manual pixel-level checks.
 */
describe('vehicules end-to-end control', () => {
  let auth: AuthService;
  let vehicles: VehicleService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    auth = TestBed.inject(AuthService);
    vehicles = TestBed.inject(VehicleService);
    router = TestBed.inject(Router);
    await TestBed.compileComponents();
  });

  it('creates, searches, views, edits and deletes a vehicle linked to a client', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/vehicules');
    const fixture = harness.fixture;

    // 1. Create, attached to an existing client
    await harness.navigateByUrl('/vehicules/nouveau');
    const form = harness.fixture.debugElement.query(By.directive(VehicleForm))
      ?.componentInstance as VehicleForm;
    expect(form).toBeTruthy();
    form.form.setValue({
      plate: 'ZZ-123-ZZ',
      make: 'Peugeot',
      model: '208',
      year: '2022',
      clientId: 'client-1',
    });
    await form.onSubmit();
    fixture.detectChanges();

    const created = vehicles.vehicles().find((vehicle) => vehicle.plate === 'ZZ-123-ZZ');
    expect(created).toBeTruthy();
    expect(created?.clientId).toBe('client-1');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('créé');

    // The form redirects to the new vehicle's detail.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await fixture.whenStable();
    expect(router.url).toBe(`/vehicules/${created!.id}`);

    // 2. Search from the list
    await harness.navigateByUrl('/vehicules');
    vehicles.setQuery('peugeot');
    fixture.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('ZZ-123-ZZ');
    expect(harness.routeNativeElement?.textContent).not.toContain('Clio');

    // 3. View the detail with the resolved owner
    await harness.navigateByUrl(`/vehicules/${created!.id}`);
    expect(harness.routeNativeElement?.textContent).toContain('Camille Durand');
    expect(harness.routeNativeElement?.textContent).toContain('2022');

    // 4. Edit
    await harness.navigateByUrl(`/vehicules/${created!.id}/modifier`);
    const editForm = harness.fixture.debugElement.query(By.directive(VehicleForm))
      ?.componentInstance as VehicleForm;
    expect(editForm.form.controls.plate.value).toBe('ZZ-123-ZZ');
    editForm.form.controls.model.setValue('208 GT');
    await editForm.onSubmit();
    fixture.detectChanges();
    expect(vehicles.getById(created!.id)?.model).toBe('208 GT');

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await fixture.whenStable();
    expect(router.url).toBe(`/vehicules/${created!.id}`);
    expect(harness.routeNativeElement?.textContent).toContain('208 GT');

    // 5. Delete behind an explicit confirmation
    const detail = harness.fixture.debugElement.query(By.directive(VehicleDetail))
      ?.componentInstance as VehicleDetail;
    detail.requestDelete();
    fixture.detectChanges();
    expect(detail.confirming()).toBe(true);
    expect(vehicles.getById(created!.id)).toBeTruthy();

    detail.confirmDelete();
    fixture.detectChanges();
    expect(vehicles.getById(created!.id)).toBeUndefined();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('supprimé');

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await fixture.whenStable();
    expect(router.url).toBe('/vehicules');
  });

  it('shows a not-found state for an unknown vehicle id', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const harness = await RouterTestingHarness.create('/vehicules/unknown-id');

    expect(router.url).toBe('/vehicules/unknown-id');
    expect(harness.routeNativeElement?.textContent).toContain('introuvable');
  });

  it('associates every form field with a label for keyboard and screen-reader access', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/vehicules/nouveau');
    const root = harness.routeNativeElement as HTMLElement;

    const fields = Array.from(root.querySelectorAll('input, select'));
    expect(fields.length).toBeGreaterThan(0);
    for (const field of fields) {
      expect(field.id).toBeTruthy();
      expect(root.querySelector(`label[for="${field.id}"]`)).toBeTruthy();
      expect(field.getAttribute('tabindex')).not.toBe('-1');
    }
  });
});
