import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ClientList } from './client-list';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';

describe('ClientList', () => {
  let service: ClientService;
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [ClientList],
      providers: [provideRouter([])],
    });
    service = TestBed.inject(ClientService);
    auth = TestBed.inject(AuthService);
    await TestBed.compileComponents();
  });

  async function render() {
    const fixture = TestBed.createComponent(ClientList);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders the existing clients with their details', async () => {
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('Camille Durand');
    expect(text).toContain('camille.durand@example.com');
  });

  it('shows an explicit empty state when no client exists', async () => {
    for (const client of service.clients()) {
      service.delete(client.id);
    }
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('Aucun client');
    expect(text).not.toContain('Camille Durand');
  });

  it('shows a no-result state and a way to clear the search', async () => {
    service.setQuery('zzz-unknown');
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Aucun résultat');
    expect(el.textContent).not.toContain('Camille Durand');
    const clearButton = Array.from(el.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Effacer la recherche')
    );
    expect(clearButton).toBeTruthy();
  });

  it('filters the list according to the search query', async () => {
    service.setQuery('lea');
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('Léa Moreau');
    expect(text).not.toContain('Camille Durand');
  });

  it('updates the query from the search input', async () => {
    const fixture = await render();
    const input = fixture.nativeElement.querySelector('#client-search') as HTMLInputElement;
    input.value = 'karim';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(service.query()).toBe('karim');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Karim Benali');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Camille Durand');
  });

  it('shows the create action to an administrateur', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const fixture = await render();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nouveau client');
  });

  it('hides the create action from an employé', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const fixture = await render();

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Nouveau client');
  });

  it('uses a responsive layout: scrollable table on desktop, cards on mobile', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    // Table variant: horizontally scrollable container, hidden on small screens.
    const scrollContainer = el.querySelector('div.overflow-x-auto');
    expect(scrollContainer).toBeTruthy();
    expect(scrollContainer?.className).toContain('md:block');

    // Card fallback: hidden from the md breakpoint up.
    const cardList = el.querySelector('ul.md\\:hidden');
    expect(cardList).toBeTruthy();
  });
});
