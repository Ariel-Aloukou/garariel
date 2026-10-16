import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InterventionList } from './intervention-list';
import { InterventionService } from '../../../core/services/intervention.service';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';

describe('InterventionList', () => {
  let service: InterventionService;
  let clients: ClientService;
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [InterventionList],
      providers: [provideRouter([])],
    });
    service = TestBed.inject(InterventionService);
    clients = TestBed.inject(ClientService);
    auth = TestBed.inject(AuthService);
    await TestBed.compileComponents();
  });

  async function render() {
    const fixture = TestBed.createComponent(InterventionList);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders the existing interventions with their date, vehicle, owner, status and cost', async () => {
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('2026-09-15');
    expect(text).toContain('AB-123-CD');
    expect(text).toContain('Camille Durand');
    expect(text).toContain('Terminée');
    expect(text).toContain('189.90 €');
  });

  it('shows every status as a coloured badge with its text label', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('En attente');
    expect(el.textContent).toContain('En cours');
    expect(el.textContent).toContain('Terminée');

    const badge = el.querySelector('.rounded-full') as HTMLElement | null;
    expect(badge).toBeTruthy();
    expect(badge?.className).toContain('text-');
  });

  it('filters the list according to the search query', async () => {
    service.setQuery('yaris');
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('Yaris');
    expect(text).not.toContain('Clio');
  });

  it('updates the query from the search input', async () => {
    const fixture = await render();
    const input = fixture.nativeElement.querySelector('#intervention-search') as HTMLInputElement;
    input.value = 'clio';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(service.query()).toBe('clio');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Clio');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Yaris');
  });

  it('filters by status from the select and clears with the reset button', async () => {
    const fixture = await render();
    const select = fixture.nativeElement.querySelector('#intervention-status-filter') as HTMLSelectElement;

    select.value = 'pending';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(service.statusFilter()).toBe('pending');
    let text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('2026-10-14');
    expect(text).not.toContain('2026-09-15');

    const reset = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Réinitialiser')
    );
    reset?.click();
    fixture.detectChanges();

    expect(service.statusFilter()).toBe('all');
    text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('2026-09-15');
  });

  it('filters by date range from the date inputs', async () => {
    const fixture = await render();
    const from = fixture.nativeElement.querySelector('#intervention-date-from') as HTMLInputElement;

    from.value = '2026-10-01';
    from.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(service.dateFrom()).toBe('2026-10-01');
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).not.toContain('2026-09-15');
    expect(text).toContain('2026-10-02');
  });

  it('shows the empty state when no intervention exists', async () => {
    for (const intervention of service.interventions()) {
      service.delete(intervention.id);
    }
    const fixture = await render();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aucune intervention enregistrée');
  });

  it('shows the no-result state and offers to clear the filters', async () => {
    service.setQuery('zzz-unknown');
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Aucune intervention ne correspond');
    const clearButton = Array.from(el.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Effacer la recherche')
    );
    expect(clearButton).toBeTruthy();
  });

  it('shows the create action to an administrateur', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const fixture = await render();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nouvelle intervention');
  });

  it('hides the write actions when workshop:manage is not granted', async () => {
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).not.toContain('Nouvelle intervention');
    expect(text).not.toContain('Modifier');
  });

  it('resolves the vehicle and owner, flagging a missing vehicle', async () => {
    service.create({
      vehicleId: 'ghost-vehicle',
      date: '2026-10-16',
      problem: 'Véhicule disparu',
      status: 'pending',
    });
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('AB-123-CD');
    expect(text).toContain('Camille Durand');
    expect(text).toContain('Véhicule introuvable');
    expect(text).toContain('Propriétaire introuvable');
  });

  it('flags a missing owner when the client no longer exists', async () => {
    const fixture = await render();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Camille Durand');

    clients.delete('client-1');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Propriétaire introuvable');
  });

  it('uses a responsive layout: scrollable table plus a card fallback', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    const scrollContainer = el.querySelector('div.overflow-x-auto');
    expect(scrollContainer).toBeTruthy();
    expect(scrollContainer?.className).toContain('md:block');
    expect(scrollContainer?.className).toContain('hidden');

    const cardList = el.querySelector('ul.md\\:hidden');
    expect(cardList).toBeTruthy();
  });
});
