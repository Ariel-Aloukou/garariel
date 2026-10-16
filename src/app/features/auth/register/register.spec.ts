import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Register } from './register';

describe('Register', () => {
  let fixture: ComponentFixture<Register>;
  let comp: Register;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Register);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  async function submit(): Promise<void> {
    await comp.onSubmit();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the minimal password policy errors for a weak password', async () => {
    comp.form.setValue({ identifier: 'user@example.com', password: 'short', passwordConfirm: 'short' });
    await submit();

    expect(el().textContent).toContain('Au moins 8 caractères');
  });

  it('rejects a password without a digit', async () => {
    comp.form.setValue({
      identifier: 'user@example.com',
      password: 'abcdefghij',
      passwordConfirm: 'abcdefghij',
    });
    await submit();

    expect(comp.error()).toBeNull(); // blocked by form validation, not the service
    expect(comp.form.controls.password.valid).toBe(false);
  });

  it('reports a mismatched confirmation via an accessible alert', async () => {
    comp.form.setValue({
      identifier: 'user@example.com',
      password: 'Password123',
      passwordConfirm: 'Password124',
    });
    await submit();

    expect(comp.error()).toContain('confirmation');
    expect(el().querySelector('[role="alert"]')).toBeTruthy();
  });

  it('surfaces a duplicate-identifier error from the service', async () => {
    comp.form.setValue({
      identifier: 'staff@example.com',
      password: 'Password123',
      passwordConfirm: 'Password123',
    });
    await submit();

    expect(comp.error()).toContain('déjà utilisé');
    expect(el().querySelector('[role="alert"]')?.textContent).toContain('déjà utilisé');
  });

  it('creates a valid account and shows a success status', async () => {
    comp.form.setValue({
      identifier: 'newuser@example.com',
      password: 'Password123',
      passwordConfirm: 'Password123',
    });
    await submit();

    expect(comp.success()).toContain('Compte créé');
    expect(el().querySelector('[role="status"]')).toBeTruthy();
    expect(localStorage.getItem('garariel.auth.users')).toContain('newuser@example.com');
  });
});
