import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { VehicleDetail } from './vehicle-detail';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ClientService } from '../../../core/services/client.service';

describe('VehicleDetail', () => {
  let service: VehicleService;
  let clients: ClientService;

  function setup(params: Record<string, string> = {}): void {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [VehicleDetail],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
      ],
    });
    service = TestBed.inject(VehicleService);
    clients = TestBed.inject(ClientService);
  }

  async function render() {
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(VehicleDetail);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders the details of an existing vehicle with its owner', async () => {
    setup({ id: 'vehicle-1' });
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('AB-123-CD');
    expect(text).toContain('Renault');
    expect(text).toContain('Clio');
    expect(text).toContain('2019');
    expect(text).toContain('Camille Durand');
  });

  it('renders a placeholder when the vehicle has no year', async () => {
    setup({ id: 'vehicle-3' });
    const fixture = await render();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('—');
  });

  it('shows a not-found state with a way back to the list', async () => {
    setup({ id: 'unknown-id' });
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('introuvable');
    const backLink = el.querySelector('a[href="/vehicules"]');
    expect(backLink).toBeTruthy();
  });

  it('flags a vehicle whose owner client no longer exists', async () => {
    setup({ id: 'vehicle-1' });
    const fixture = await render();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Camille Durand');

    clients.delete('client-1');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Client introuvable');
  });

  it('asks for confirmation before deleting and keeps the vehicle when cancelling', async () => {
    setup({ id: 'vehicle-1' });
    const fixture = await render();
    const component = fixture.componentInstance;

    expect(component.confirming()).toBe(false);
    fixture.componentInstance.requestDelete();
    fixture.detectChanges();
    expect(component.confirming()).toBe(true);
    expect(service.getById('vehicle-1')).toBeTruthy();

    component.cancelDelete();
    fixture.detectChanges();
    expect(component.confirming()).toBe(false);
    expect(service.getById('vehicle-1')).toBeTruthy();
  });

  it('deletes the vehicle once confirmed and reports success', async () => {
    setup({ id: 'vehicle-1' });
    const fixture = await render();
    const component = fixture.componentInstance;

    vi.useFakeTimers();
    component.requestDelete();
    component.confirmDelete();
    fixture.detectChanges();

    expect(service.getById('vehicle-1')).toBeUndefined();
    expect(component.deleted()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('supprimé');
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('hides the write actions when workshop:manage is not granted', async () => {
    setup({ id: 'vehicle-1' });
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).not.toContain('Supprimer');
    expect(text).not.toContain('Modifier');
  });
});
