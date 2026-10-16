import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');

  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly loading = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)],
    ],
    passwordConfirm: ['', [Validators.required]],
  });

  async onSubmit(): Promise<void> {
    this.error.set(null);
    this.success.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { identifier, password, passwordConfirm } = this.form.getRawValue();
    if (password !== passwordConfirm) {
      this.error.set('La confirmation du mot de passe ne correspond pas.');
      setTimeout(() => this.errorSummary()?.nativeElement.focus());
      return;
    }

    this.loading.set(true);
    const result = await this.auth.register(identifier, password, passwordConfirm);
    this.loading.set(false);

    if (!result.success) {
      this.error.set(result.error ?? "Échec de l'inscription.");
      setTimeout(() => this.errorSummary()?.nativeElement.focus());
      return;
    }

    this.success.set('Compte créé. Vous pouvez maintenant vous connecter.');
    setTimeout(() => void this.router.navigate(['/auth/login']).catch(() => undefined), 1200);
  }
}
