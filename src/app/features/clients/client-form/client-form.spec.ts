import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ClientForm } from './client-form';
import { ClientService } from '../../../core/services/client.service';

describe('ClientForm', () => {
  let service: ClientService;

  function setup(params: Record<string, string> = {}): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ClientForm],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
      ],
    });
    service = TestBed.inject(ClientService);
  }

  async function render() {
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(ClientForm);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('blocks submission and focuses a summary when required fields are empty', async () => {
    setup();
    const fixture = await render();
    const before = service.count();

    vi.useFakeTimers();
    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    vi.runOnlyPendingTimers();

    expect(service.count()).toBe(before);
    const summary = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement | null;
    expect(summary).toBeTruthy();
    expect(document.activeElement).toBe(summary);
    vi.useRealTimers();
  });

  it('shows format errors for an invalid phone and email', async () => {
    setup();
    const fixture = await render();
    const component = fixture.componentInstance;

    component.form.controls.phone.setValue('abc');
    component.form.controls.phone.markAsTouched();
    component.form.controls.email.setValue('not-an-email');
    component.form.controls.email.markAsTouched();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Format de téléphone invalide');
    expect(text).toContain("Format d'email invalide");
  });

  it('creates a client without an address (optional field)', async () => {
    setup();
    const fixture = await render();
    const before = service.count();

    vi.useFakeTimers();
    fixture.componentInstance.form.setValue({
      fullName: 'Nouveau Client',
      phone: '06 12 34 56 78',
      email: 'nouveau@example.com',
      address: '',
    });
    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(service.count()).toBe(before + 1);
    const created = service.clients().find((client) => client.email === 'nouveau@example.com');
    expect(created?.address).toBe('');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('créé');
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('prefills the form and updates an existing client in edit mode', async () => {
    setup({ id: 'client-1' });
    const fixture = await render();
    const component = fixture.componentInstance;

    expect(component.isEdit).toBe(true);
    expect(component.form.getRawValue().fullName).toBe('Camille Durand');

    vi.useFakeTimers();
    component.form.controls.fullName.setValue('Camille Durand-Modifiée');
    await component.onSubmit();
    fixture.detectChanges();

    expect(service.getById('client-1')?.fullName).toBe('Camille Durand-Modifiée');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('modifié');
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('shows a not-found state when editing an unknown client', async () => {
    setup({ id: 'unknown-id' });
    const fixture = await render();

    expect(fixture.componentInstance.notFound()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('introuvable');
  });
});
