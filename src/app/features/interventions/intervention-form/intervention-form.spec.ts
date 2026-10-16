import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { InterventionForm } from './intervention-form';
import { InterventionService } from '../../../core/services/intervention.service';
import { VehicleService } from '../../../core/services/vehicle.service';

describe('InterventionForm', () => {
  let interventions: InterventionService;
  let vehicles: VehicleService;

  function setup(params: Record<string, string> = {}): void {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [InterventionForm],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
      ],
    });
    interventions = TestBed.inject(InterventionService);
    vehicles = TestBed.inject(VehicleService);
  }

  async function render() {
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(InterventionForm);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('blocks submission and focuses a summary when required fields are empty', async () => {
    setup();
    const fixture = await render();
    const before = interventions.count();

    vi.useFakeTimers();
    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    vi.runOnlyPendingTimers();

    expect(interventions.count()).toBe(before);
    const summary = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement | null;
    expect(summary).toBeTruthy();
    expect(document.activeElement).toBe(summary);
    vi.useRealTimers();
  });

  it('shows format errors for an invalid date and cost', async () => {
    setup();
    const fixture = await render();
    const component = fixture.componentInstance;

    component.form.controls.vehicleId.setValue('vehicle-1');
    component.form.controls.date.setValue('2026-02-31');
    component.form.controls.date.markAsTouched();
    component.form.controls.problem.setValue('Bruit');
    component.form.controls.cost.setValue('12,345');
    component.form.controls.cost.markAsTouched();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Date invalide');
    expect(text).toContain('Coût invalide');
  });

  it('rejects a negative or non-numeric cost', async () => {
    setup();
    const fixture = await render();
    const component = fixture.componentInstance;
    const before = interventions.count();

    component.form.controls.vehicleId.setValue('vehicle-1');
    component.form.controls.date.setValue('2026-10-16');
    component.form.controls.problem.setValue('Test');

    component.form.controls.cost.setValue('-5');
    expect(component.form.controls.cost.hasError('cost')).toBe(true);

    component.form.controls.cost.setValue('gratuit');
    expect(component.form.controls.cost.hasError('cost')).toBe(true);

    component.form.controls.cost.setValue('');
    fixture.detectChanges();

    vi.useFakeTimers();
    await component.onSubmit();
    vi.runOnlyPendingTimers();

    const created = interventions
      .interventions()
      .find((intervention) => intervention.problem === 'Test');
    expect(created?.cost).toBeUndefined();
    expect(interventions.count()).toBe(before + 1);
    vi.useRealTimers();
  });

  it('creates an intervention with the default pending status and navigates to it', async () => {
    setup();
    const fixture = await render();
    const component = fixture.componentInstance;
    const before = interventions.count();

    component.form.controls.vehicleId.setValue('vehicle-1');
    component.form.controls.date.setValue('2026-10-16');
    component.form.controls.problem.setValue('  Voyant moteur  ');
    fixture.detectChanges();

    vi.useFakeTimers();
    await component.onSubmit();
    fixture.detectChanges();

    expect(interventions.count()).toBe(before + 1);
    const created = interventions
      .interventions()
      .find((intervention) => intervention.problem === 'Voyant moteur');
    expect(created).toBeTruthy();
    expect(created?.status).toBe('pending');
    expect(created?.vehicleId).toBe('vehicle-1');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('créée');
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('accepts a comma-separated optional cost and stores it as a number', async () => {
    setup();
    const fixture = await render();
    const component = fixture.componentInstance;

    component.form.controls.vehicleId.setValue('vehicle-1');
    component.form.controls.date.setValue('2026-10-16');
    component.form.controls.problem.setValue('Révision');
    component.form.controls.cost.setValue('189,90');
    fixture.detectChanges();

    vi.useFakeTimers();
    await component.onSubmit();
    vi.runOnlyPendingTimers();

    const created = interventions
      .interventions()
      .find((intervention) => intervention.problem === 'Révision');
    expect(created?.cost).toBe(189.9);
    vi.useRealTimers();
  });

  it('loads and updates an existing intervention including its status', async () => {
    setup({ id: 'intervention-1' });
    const fixture = await render();
    const component = fixture.componentInstance;

    expect(component.isEdit).toBe(true);
    expect(component.form.controls.problem.value).toBe('Bruit anormal au freinage.');
    expect(component.form.controls.status.value).toBe('done');
    expect(component.form.controls.cost.value).toBe('189.9');

    vi.useFakeTimers();
    component.form.controls.status.setValue('in_progress');
    component.form.controls.problem.setValue('Bruit modifié');
    await component.onSubmit();
    fixture.detectChanges();

    expect(interventions.getById('intervention-1')?.status).toBe('in_progress');
    expect(interventions.getById('intervention-1')?.problem).toBe('Bruit modifié');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('modifiée');
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('shows a not-found state for an unknown intervention id', async () => {
    setup({ id: 'unknown-id' });
    const fixture = await render();

    expect(fixture.componentInstance.notFound).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('introuvable');
  });

  it('shows the owner of the selected vehicle', async () => {
    setup();
    const fixture = await render();
    const component = fixture.componentInstance;

    component.form.controls.vehicleId.setValue('vehicle-1');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Propriétaire');
    expect(text).toContain('Camille Durand');
  });

  it('blocks creation and offers to create a vehicle when none exists', async () => {
    setup();
    for (const vehicle of vehicles.vehicles()) {
      vehicles.delete(vehicle.id);
    }
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Aucun véhicule disponible');
    expect(el.querySelector('a[href="/vehicules/nouveau"]')).toBeTruthy();

    const before = interventions.count();
    vi.useFakeTimers();
    await fixture.componentInstance.onSubmit();
    vi.runOnlyPendingTimers();
    expect(interventions.count()).toBe(before);
    vi.useRealTimers();
  });

  it('refuses a submission whose vehicle no longer exists', async () => {
    setup();
    const fixture = await render();
    const component = fixture.componentInstance;
    const before = interventions.count();

    component.form.controls.vehicleId.setValue('unknown-vehicle');
    component.form.controls.date.setValue('2026-10-16');
    component.form.controls.problem.setValue('Test');
    vi.useFakeTimers();
    await component.onSubmit();
    fixture.detectChanges();

    expect(interventions.count()).toBe(before);
    expect(component.form.controls.vehicleId.hasError('unknownVehicle')).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('introuvable');
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });
});
