import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { InterventionDetail } from './intervention-detail';
import { InterventionService } from '../../../core/services/intervention.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';

describe('InterventionDetail', () => {
  let service: InterventionService;
  let vehicles: VehicleService;
  let clients: ClientService;
  let auth: AuthService;

  function setup(params: Record<string, string> = {}): void {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [InterventionDetail],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
      ],
    });
    service = TestBed.inject(InterventionService);
    vehicles = TestBed.inject(VehicleService);
    clients = TestBed.inject(ClientService);
    auth = TestBed.inject(AuthService);
  }

  async function render() {
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(InterventionDetail);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders all the details of an existing intervention with its vehicle and owner', async () => {
    setup({ id: 'intervention-1' });
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('2026-09-15');
    expect(text).toContain('AB-123-CD');
    expect(text).toContain('Renault');
    expect(text).toContain('Clio');
    expect(text).toContain('Camille Durand');
    expect(text).toContain('Bruit anormal au freinage.');
    expect(text).toContain('Plaquettes de frein avant usées.');
    expect(text).toContain('Remplacement des plaquettes de frein avant.');
    expect(text).toContain('189.90 €');
    expect(text).toContain('Terminée');
  });

  it('renders placeholders for the missing optional fields', async () => {
    setup({ id: 'intervention-3' });
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('—');
    expect(text).toContain('En attente');
  });

  it('shows a not-found state with a way back to the list', async () => {
    setup({ id: 'unknown-id' });
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('introuvable');
    expect(el.querySelector('a[href="/interventions"]')).toBeTruthy();
  });

  it('flags an intervention whose vehicle no longer exists', async () => {
    setup({ id: 'intervention-1' });
    vehicles.delete('vehicle-1');
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('Véhicule introuvable');
    expect(text).toContain('Propriétaire introuvable');
  });

  it('flags an intervention whose owner client no longer exists', async () => {
    setup({ id: 'intervention-1' });
    const fixture = await render();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Camille Durand');

    clients.delete('client-1');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Propriétaire introuvable');
  });

  it('asks for confirmation before deleting and keeps the intervention when cancelling', async () => {
    setup({ id: 'intervention-1' });
    await auth.login('admin@example.com', 'admin1234');
    const fixture = await render();
    const component = fixture.componentInstance;

    expect(component.confirming()).toBe(false);
    component.requestDelete();
    fixture.detectChanges();
    expect(component.confirming()).toBe(true);
    expect(service.getById('intervention-1')).toBeTruthy();

    component.cancelDelete();
    fixture.detectChanges();
    expect(component.confirming()).toBe(false);
    expect(service.getById('intervention-1')).toBeTruthy();
  });

  it('deletes the intervention once confirmed and reports success', async () => {
    setup({ id: 'intervention-1' });
    await auth.login('admin@example.com', 'admin1234');
    const fixture = await render();
    const component = fixture.componentInstance;

    vi.useFakeTimers();
    component.requestDelete();
    component.confirmDelete();
    fixture.detectChanges();

    expect(service.getById('intervention-1')).toBeUndefined();
    expect(component.deleted()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('supprimée');
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('hides the write actions when workshop:manage is not granted', async () => {
    setup({ id: 'intervention-1' });
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).not.toContain('Supprimer');
    expect(text).not.toContain('Modifier');
  });
});
