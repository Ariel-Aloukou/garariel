import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ClientDetail } from './client-detail';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';

describe('ClientDetail', () => {
  let service: ClientService;
  let auth: AuthService;

  function setup(params: Record<string, string> = {}): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ClientDetail],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
      ],
    });
    service = TestBed.inject(ClientService);
    auth = TestBed.inject(AuthService);
  }

  async function render() {
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(ClientDetail);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders the details of an existing client', async () => {
    setup({ id: 'client-1' });
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('Camille Durand');
    expect(text).toContain('camille.durand@example.com');
  });

  it('shows a not-found state with a way back to the list', async () => {
    setup({ id: 'unknown-id' });
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('introuvable');
    const backLink = el.querySelector('a[href="/clients"]');
    expect(backLink).toBeTruthy();
  });

  it('asks for confirmation before deleting and keeps the client when cancelling', async () => {
    await auth.login('admin@example.com', 'admin1234');
    setup({ id: 'client-1' });
    const fixture = await render();
    const component = fixture.componentInstance;

    expect(component.confirming()).toBe(false);
    component.requestDelete();
    fixture.detectChanges();
    expect(component.confirming()).toBe(true);
    expect(service.getById('client-1')).toBeTruthy();

    component.cancelDelete();
    fixture.detectChanges();
    expect(component.confirming()).toBe(false);
    expect(service.getById('client-1')).toBeTruthy();
  });

  it('deletes the client once confirmed and reports success', async () => {
    setup({ id: 'client-1' });
    const fixture = await render();
    const component = fixture.componentInstance;

    vi.useFakeTimers();
    component.requestDelete();
    component.confirmDelete();
    fixture.detectChanges();

    expect(service.getById('client-1')).toBeUndefined();
    expect(component.deleted()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('supprimé');
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('hides the delete action from an employé', async () => {
    await auth.login('staff@example.com', 'staff1234');
    setup({ id: 'client-1' });
    const fixture = await render();

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Supprimer');
  });
});
