import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AuthService } from '../../core/services/auth.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { loadVehicles } from '../../data-access/vehicle.data';

const VEHICLES_KEY = 'garariel.vehicles';

/**
 * Verifies vehicle creation and edition through the real router, guards and DOM.
 * Unlike the component specs (which call `form.setValue` then `onSubmit`), this
 * types into the real inputs — including the `type="number"` year field — and
 * clicks the real submit button, which is where the real bug lived.
 */
describe('vehicle create/edit (real UI integration)', () => {
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

  function typeInto(root: HTMLElement, selector: string, value: string): void {
    const field = root.querySelector(selector) as HTMLInputElement;
    expect(field).toBeTruthy();
    field.value = value;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));
  }

  function selectValue(root: HTMLElement, selector: string, value: string): void {
    const select = root.querySelector(selector) as HTMLSelectElement;
    expect(select).toBeTruthy();
    select.value = value;
    select.dispatchEvent(new Event('change'));
    select.dispatchEvent(new Event('blur'));
  }

  function submit(root: HTMLElement, text: string): void {
    const button = Array.from(root.querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(text)
    );
    expect(button).toBeTruthy();
    (button as HTMLButtonElement).click();
  }

  it('creates a vehicle (with a year) typed into the real inputs and persists it', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/vehicules/nouveau');
    const root = harness.routeNativeElement as HTMLElement;

    typeInto(root, '#vehicle-plate', 'ZZ-123-ZZ');
    typeInto(root, '#vehicle-make', 'Peugeot');
    typeInto(root, '#vehicle-model', '208');
    typeInto(root, '#vehicle-year', '2022');
    selectValue(root, '#vehicle-clientId', 'client-1');

    submit(root, 'Créer le véhicule');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    const created = vehicles.vehicles().find((v) => v.plate === 'ZZ-123-ZZ');
    expect(created).toBeTruthy();
    expect(created?.year).toBe(2022);
    expect(created?.clientId).toBe('client-1');
    expect(localStorage.getItem(VEHICLES_KEY)).toContain('ZZ-123-ZZ');
    expect(loadVehicles()?.some((v) => v.id === created!.id)).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await harness.fixture.whenStable();
    expect(router.url).toBe(`/vehicules/${created!.id}`);
  });

  it('creates a vehicle without touching the optional year field', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/vehicules/nouveau');
    const root = harness.routeNativeElement as HTMLElement;

    typeInto(root, '#vehicle-plate', 'AA-000-AA');
    typeInto(root, '#vehicle-make', 'Kia');
    typeInto(root, '#vehicle-model', 'Rio');
    typeInto(root, '#vehicle-year', '2020');
    typeInto(root, '#vehicle-year', ''); // user clears the year
    selectValue(root, '#vehicle-clientId', 'client-1');

    submit(root, 'Créer le véhicule');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    const created = vehicles.vehicles().find((v) => v.plate === 'AA-000-AA');
    expect(created).toBeTruthy();
    expect(created?.year).toBeUndefined();
  });

  it('edits a vehicle through the real inputs and persists the change', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/vehicules/vehicle-1/modifier');
    const root = harness.routeNativeElement as HTMLElement;

    typeInto(root, '#vehicle-model', 'Clio Modifiée');
    typeInto(root, '#vehicle-year', '2020');

    submit(root, 'Enregistrer les modifications');
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(vehicles.getById('vehicle-1')?.model).toBe('Clio Modifiée');
    expect(vehicles.getById('vehicle-1')?.year).toBe(2020);
    expect(loadVehicles()?.find((v) => v.id === 'vehicle-1')?.model).toBe('Clio Modifiée');
  });
});
