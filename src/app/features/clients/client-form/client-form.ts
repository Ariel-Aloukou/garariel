import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { ClientInput } from '../../../data-access/client.models';

/** Permissive phone format: digits and usual separators, 6–20 characters. */
const PHONE_PATTERN = /^[+0-9 ().-]{6,20}$/;

type FieldName = 'fullName' | 'phone' | 'email';

@Component({
  selector: 'app-client-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './client-form.html',
})
export class ClientForm {
  private readonly fb = inject(FormBuilder);
  private readonly clients = inject(ClientService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');

  private readonly clientId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = this.clientId !== null;
  readonly notFound = signal(this.isEdit && !this.clients.getById(this.clientId as string));

  readonly loading = signal(false);
  readonly success = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly showSummary = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
    },
    { updateOn: 'blur' }
  );

  constructor() {
    if (this.isEdit && !this.notFound()) {
      const client = this.clients.getById(this.clientId as string);
      if (client) {
        this.form.setValue({
          fullName: client.fullName,
          phone: client.phone,
          email: client.email,
          address: client.address ?? '',
        });
      }
    }
  }

  message(field: FieldName): string | null {
    const control = this.form.controls[field];
    if (!control.touched && !this.showSummary()) return null;
    if (control.hasError('required')) {
      if (field === 'fullName') return 'Le nom complet est requis.';
      if (field === 'phone') return 'Le téléphone est requis.';
      return "L'email est requis.";
    }
    if (field === 'phone' && control.hasError('pattern')) {
      return 'Format de téléphone invalide (chiffres et séparateurs usuels).';
    }
    if (field === 'email' && control.hasError('email')) {
      return "Format d'email invalide.";
    }
    return null;
  }

  async onSubmit(): Promise<void> {
    this.error.set(null);
    this.success.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showSummary.set(true);
      setTimeout(() => this.errorSummary()?.nativeElement.focus());
      return;
    }

    this.loading.set(true);
    const value = this.form.getRawValue();
    const input: ClientInput = {
      fullName: value.fullName,
      phone: value.phone,
      email: value.email,
      address: value.address,
    };

    if (this.isEdit) {
      const updated = this.clients.update(this.clientId as string, input);
      this.loading.set(false);
      if (!updated) {
        this.error.set("Ce client n'existe plus.");
        setTimeout(() => this.errorSummary()?.nativeElement.focus());
        return;
      }
      this.success.set('Client modifié avec succès.');
      setTimeout(
        () => void this.router.navigate(['/clients', this.clientId as string]).catch(() => undefined),
        900
      );
      return;
    }

    const created = this.clients.create(input);
    this.loading.set(false);
    this.success.set('Client créé avec succès.');
    setTimeout(
      () => void this.router.navigate(['/clients', created.id]).catch(() => undefined),
      900
    );
  }
}
