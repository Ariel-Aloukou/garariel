import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { VehicleForm } from './vehicle-form';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ClientService } from '../../../core/services/client.service';

describe('VehicleForm', () => {
  let vehicles: VehicleService;
  let clients: ClientService;

  function setup(params: Record<string, string> = {}): void {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [VehicleForm],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
      ],
    });
    vehicles = TestBed.inject(VehicleService);
    clients = TestBed.inject(ClientService);
  }

  async function render() {
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(VehicleForm);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('blocks submission and focuses a summary when required fields are empty', async () => {
    setup();
    const fixture = await render();
    const before = vehicles.count();

    vi.useFakeTimers();
    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    vi.runOnlyPendingTimers();

    expect(vehicles.count()).toBe(before);
    const summary = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement | null;
    expect(summary).toBeTruthy();
    expect(document.activeElement).toBe(summary);
    vi.useRealTimers();
  });

  it('shows format errors for an invalid plate and year', async () => {
    setup();
    const fixture = await render();
    const component = fixture.componentInstance;

    component.form.controls.plate.setValue('x');
    component.form.controls.plate.markAsTouched();
    component.form.controls.year.setValue('1800');
    component.form.controls.year.markAsTouched();
    component.form.controls.make.setValue('Ford');
    component.form.controls.model.setValue('Focus');
    component.form.controls.clientId.setValue('client-1');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain("Format d'immatriculation invalide");
    expect(text).toContain('Année invalide');
  });

  it('creates a vehicle linked to an existing client, without a year', async () => {
    setup();
    const fixture = await render();
    const before = vehicles.count();

    vi.useFakeTimers();
    fixture.componentInstance.form.setValue({
      plate: 'ZZ-999-ZZ',
      make: 'Ford',
      model: 'Focus',
      year: '',
      clientId: 'client-1',
    });
    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(vehicles.count()).toBe(before + 1);
    const created = vehicles.vehicles().find((vehicle) => vehicle.plate === 'ZZ-999-ZZ');
    expect(created?.year).toBeUndefined();
    expect(created?.clientId).toBe('client-1');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('créé');
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('loads and updates an existing vehicle', async () => {
    setup({ id: 'vehicle-1' });
    const fixture = await render();
    const component = fixture.componentInstance;

    expect(component.isEdit).toBe(true);
    expect(component.form.controls.plate.value).toBe('AB-123-CD');

    vi.useFakeTimers();
    component.form.controls.model.setValue('Clio Modifiée');
    component.form.controls.year.setValue('2020');
    await component.onSubmit();
    fixture.detectChanges();

    expect(vehicles.getById('vehicle-1')?.model).toBe('Clio Modifiée');
    expect(vehicles.getById('vehicle-1')?.year).toBe(2020);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('modifié');
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('shows a not-found state for an unknown vehicle id', async () => {
    setup({ id: 'unknown-id' });
    const fixture = await render();

    expect(fixture.componentInstance.notFound).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('introuvable');
  });

  it('blocks creation and offers to create a client when none exists', async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [VehicleForm],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
      ],
    });
    clients = TestBed.inject(ClientService);
    vehicles = TestBed.inject(VehicleService);
    for (const client of clients.clients()) {
      clients.delete(client.id);
    }

    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Aucun client disponible');
    const createClientLink = el.querySelector('a[href="/clients/nouveau"]');
    expect(createClientLink).toBeTruthy();

    const before = vehicles.count();
    vi.useFakeTimers();
    await fixture.componentInstance.onSubmit();
    vi.runOnlyPendingTimers();
    expect(vehicles.count()).toBe(before);
    vi.useRealTimers();
  });

  it('refuses a submission whose client no longer exists', async () => {
    setup();
    const fixture = await render();
    const component = fixture.componentInstance;
    const before = vehicles.count();

    component.form.setValue({
      plate: 'ZZ-999-ZZ',
      make: 'Ford',
      model: 'Focus',
      year: '',
      clientId: 'unknown-client',
    });
    vi.useFakeTimers();
    await component.onSubmit();
    fixture.detectChanges();

    expect(vehicles.count()).toBe(before);
    expect(component.form.controls.clientId.hasError('unknownClient')).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('introuvable');
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });
});
