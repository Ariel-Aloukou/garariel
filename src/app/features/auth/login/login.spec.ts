import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let comp: Login;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Login);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  async function submit(): Promise<void> {
    await comp.onSubmit();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('marks controls touched and shows inline errors when submitting an empty form', async () => {
    comp.form.setValue({ identifier: '', password: '' });
    await submit();

    expect(comp.form.controls.identifier.touched).toBe(true);
    expect(comp.form.controls.password.touched).toBe(true);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("L'identifiant est requis");
    expect(el.textContent).toContain('Le mot de passe est requis');
  });

  it('renders an accessible role="alert" summary on invalid credentials', async () => {
    comp.form.setValue({ identifier: 'nobody@example.com', password: 'wrongpass' });
    await submit();

    expect(comp.error()).toContain('invalide');
    const el = fixture.nativeElement as HTMLElement;
    const alert = el.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert?.getAttribute('tabindex')).toBe('-1');
    expect(alert?.textContent).toContain('invalide');
  });

  it('toggles the password visibility control', async () => {
    const passwordInput = () => (fixture.nativeElement as HTMLElement).querySelector('#password') as HTMLInputElement;
    expect(passwordInput().type).toBe('password');

    comp.showPassword.set(true);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(passwordInput().type).toBe('text');

    const toggle = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label*="mot de passe"]'
    ) as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });
});
