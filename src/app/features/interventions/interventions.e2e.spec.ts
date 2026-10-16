import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { AuthService } from '../../core/services/auth.service';
import { InterventionService } from '../../core/services/intervention.service';
import { InterventionForm } from './intervention-form/intervention-form';
import { InterventionDetail } from './intervention-detail/intervention-detail';

/**
 * End-to-end control through the real router and guards, mirroring the
 * vehicles domain: create → search/filter → detail → edit (status) → delete.
 */
describe('interventions end-to-end control', () => {
  let auth: AuthService;
  let interventions: InterventionService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    auth = TestBed.inject(AuthService);
    interventions = TestBed.inject(InterventionService);
    router = TestBed.inject(Router);
    await TestBed.compileComponents();
  });

  it('creates, searches, filters, views, edits (status) and deletes an intervention', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/interventions');
    const fixture = harness.fixture;

    // 1. Create, attached to an existing vehicle
    await harness.navigateByUrl('/interventions/nouveau');
    const form = harness.fixture.debugElement.query(By.directive(InterventionForm))
      ?.componentInstance as InterventionForm;
    expect(form).toBeTruthy();
    form.form.setValue({
      vehicleId: 'vehicle-1',
      date: '2026-10-16',
      problem: 'Parcours E2E',
      diagnosis: 'Diagnostic E2E',
      workDone: '',
      cost: '50',
      status: 'pending',
    });
    await form.onSubmit();
    fixture.detectChanges();

    const created = interventions
      .interventions()
      .find((intervention) => intervention.problem === 'Parcours E2E');
    expect(created).toBeTruthy();
    expect(created?.status).toBe('pending');
    expect(created?.cost).toBe(50);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('créée');

    // The form redirects to the new intervention's detail.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await fixture.whenStable();
    expect(router.url).toBe(`/interventions/${created!.id}`);

    // 2. Search from the list by plate and owner
    await harness.navigateByUrl('/interventions');
    interventions.setQuery('ab123');
    fixture.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('AB-123-CD');
    expect(harness.routeNativeElement?.textContent).not.toContain('EF-456-GH');

    interventions.setQuery('camille');
    fixture.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Camille Durand');
    expect(harness.routeNativeElement?.textContent).not.toContain('Léa Moreau');

    // 3. Filter by status
    interventions.clearFilters();
    interventions.setStatusFilter('pending');
    fixture.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('2026-10-16');
    expect(harness.routeNativeElement?.textContent).not.toContain('2026-09-15');

    // 4. View the detail with the resolved vehicle, owner and status
    await harness.navigateByUrl(`/interventions/${created!.id}`);
    expect(harness.routeNativeElement?.textContent).toContain('AB-123-CD');
    expect(harness.routeNativeElement?.textContent).toContain('Camille Durand');
    expect(harness.routeNativeElement?.textContent).toContain('En attente');
    expect(harness.routeNativeElement?.textContent).toContain('50.00 €');

    // 5. Edit the status
    await harness.navigateByUrl(`/interventions/${created!.id}/modifier`);
    const editForm = harness.fixture.debugElement.query(By.directive(InterventionForm))
      ?.componentInstance as InterventionForm;
    expect(editForm.form.controls.problem.value).toBe('Parcours E2E');
    editForm.form.controls.status.setValue('done');
    await editForm.onSubmit();
    fixture.detectChanges();
    expect(interventions.getById(created!.id)?.status).toBe('done');

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await fixture.whenStable();
    expect(router.url).toBe(`/interventions/${created!.id}`);
    expect(harness.routeNativeElement?.textContent).toContain('Terminée');

    // 6. Delete behind an explicit confirmation
    const detail = harness.fixture.debugElement.query(By.directive(InterventionDetail))
      ?.componentInstance as InterventionDetail;
    detail.requestDelete();
    fixture.detectChanges();
    expect(detail.confirming()).toBe(true);
    expect(interventions.getById(created!.id)).toBeTruthy();

    detail.confirmDelete();
    fixture.detectChanges();
    expect(interventions.getById(created!.id)).toBeUndefined();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('supprimée');

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await fixture.whenStable();
    expect(router.url).toBe('/interventions');
  });

  it('shows a not-found state for an unknown intervention id', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const harness = await RouterTestingHarness.create('/interventions/unknown-id');

    expect(router.url).toBe('/interventions/unknown-id');
    expect(harness.routeNativeElement?.textContent).toContain('introuvable');
  });

  it('associates every form field with a label for keyboard and screen-reader access', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const harness = await RouterTestingHarness.create('/interventions/nouveau');
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
