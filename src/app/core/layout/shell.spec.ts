import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Shell } from './shell';
import { AuthService } from '../services/auth.service';

describe('Shell', () => {
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
    await TestBed.compileComponents();
  });

  it('shows the session identifier and role indicator', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('staff@example.com');
    expect(el.textContent).toContain('employe');
  });

  it('hides the admin-only navigation entry for the employe role', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Paramètres');
  });

  it('shows the admin-only navigation entry for the administrateur role', async () => {
    await auth.login('admin@example.com', 'admin1234');
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Paramètres');
  });

  it('points the Clients entry at /clients for a role with clients:read', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const clientsLink = Array.from(el.querySelectorAll('a')).find(
      (link) => link.textContent?.trim() === 'Clients'
    );
    expect(clientsLink).toBeTruthy();
    expect(clientsLink?.getAttribute('href')).toBe('/clients');
  });

  it('clears the session on logout', async () => {
    await auth.login('staff@example.com', 'staff1234');
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();

    (fixture.componentInstance as Shell).logout();
    expect(auth.isAuthenticated()).toBe(false);
  });
});
