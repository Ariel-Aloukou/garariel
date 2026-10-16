import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { VehicleList } from './vehicle-list';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';

describe('VehicleList', () => {
  let service: VehicleService;
  let clients: ClientService;
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [VehicleList],
      providers: [provideRouter([])],
    });
    service = TestBed.inject(VehicleService);
    clients = TestBed.inject(ClientService);
    auth = TestBed.inject(AuthService);
    await TestBed.compileComponents();
  });

  async function render() {
    const fixture = TestBed.createComponent(VehicleList);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders the existing vehicles with their details', async () => {
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('AB-123-CD');
    expect(text).toContain('Renault');
    expect(text).toContain('Clio');
    expect(text).toContain('Camille Durand');
  });

  it('filters the list according to the search query', async () => {
    service.setQuery('toyota');
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('Yaris');
    expect(text).not.toContain('Clio');
  });

  it('updates the query from the search input', async () => {
    const fixture = await render();
    const input = fixture.nativeElement.querySelector('#vehicle-search') as HTMLInputElement;
    input.value = 'renault';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(service.query()).toBe('renault');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Clio');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Yaris');
  });

  it('shows the empty state when no vehicle exists', async () => {
    for (const vehicle of service.vehicles()) {
      service.delete(vehicle.id);
    }
    const fixture = await render();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aucun véhicule');
  });

  it('shows the no-result state and offers to clear the search', async () => {
    service.setQuery('zzz-unknown');
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Aucun résultat');
    const clearButton = Array.from(el.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Effacer la recherche')
    );
    expect(clearButton).toBeTruthy();
  });

  it('shows the create action to an administrateur', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const fixture = await render();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nouveau véhicule');
  });

  it('hides the write actions when workshop:manage is not granted', async () => {
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).not.toContain('Nouveau véhicule');
    expect(text).not.toContain('Modifier');
  });

  it('resolves the owner name and flags a missing owner', async () => {
    const fixture = await render();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Camille Durand');

    clients.delete('client-1');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Client introuvable');
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
