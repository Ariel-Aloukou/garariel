import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { VehicleInput } from '../../../data-access/vehicle.models';

/** Permissive licence plate: 2–12 letters/digits/spaces/hyphens, starting with a letter or digit. */
const PLATE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/;
const YEAR_MIN = 1886;

function yearMax(): number {
  return new Date().getFullYear() + 1;
}

/** Optional year: when provided it must be a 4-digit value within a plausible range. */
function yearInRange(control: AbstractControl): ValidationErrors | null {
  const raw = (control.value ?? '').toString().trim();
  if (!raw) return null; // optional
  if (!/^\d{4}$/.test(raw)) return { year: true };
  const value = Number(raw);
  if (value < YEAR_MIN || value > yearMax()) return { year: true };
  return null;
}

type FieldName = 'plate' | 'make' | 'model' | 'year' | 'clientId';

@Component({
  selector: 'app-vehicle-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './vehicle-form.html',
})
export class VehicleForm {
  private readonly fb = inject(FormBuilder);
  private readonly vehicles = inject(VehicleService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');

  readonly clients = inject(ClientService);

  private readonly vehicleId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = this.vehicleId !== null;
  readonly vehicle = this.isEdit ? this.vehicles.getById(this.vehicleId as string) : undefined;
  readonly notFound = this.isEdit && !this.vehicle;
  /** Editing a vehicle whose owner client no longer exists. */
  readonly ownerMissing =
    !!this.vehicle && !this.clients.getById(this.vehicle.clientId);

  readonly loading = signal(false);
  readonly success = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly showSummary = signal(false);

  readonly form = this.fb.nonNullable.group({
    plate: ['', [Validators.required, Validators.pattern(PLATE_PATTERN)]],
    make: ['', [Validators.required]],
    model: ['', [Validators.required]],
    year: ['', [yearInRange]],
    clientId: ['', [Validators.required]],
  });

  constructor() {
    if (this.vehicle) {
      this.form.setValue({
        plate: this.vehicle.plate,
        make: this.vehicle.make,
        model: this.vehicle.model,
        year: this.vehicle.year !== undefined ? String(this.vehicle.year) : '',
        clientId: this.vehicle.clientId,
      });
    }
  }

  message(field: FieldName): string | null {
    const control = this.form.controls[field];
    if (!control.touched && !this.showSummary()) return null;
    if (field === 'plate' && control.hasError('pattern')) {
      return "Format d'immatriculation invalide (lettres, chiffres, espaces ou tirets).";
    }
    if (field === 'year' && control.hasError('year')) {
      return `Année invalide (4 chiffres entre ${YEAR_MIN} et ${yearMax()}).`;
    }
    if (field === 'clientId' && control.hasError('unknownClient')) {
      return 'Ce client est introuvable.';
    }
    if (control.hasError('required')) {
      if (field === 'plate') return "L'immatriculation est requise.";
      if (field === 'make') return 'La marque est requise.';
      if (field === 'model') return 'Le modèle est requis.';
      return 'Le client propriétaire est requis.';
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

    const value = this.form.getRawValue();
    if (!this.clients.getById(value.clientId)) {
      this.form.controls.clientId.setErrors({ unknownClient: true });
      this.form.controls.clientId.markAsTouched();
      this.showSummary.set(true);
      this.error.set('Le client propriétaire sélectionné est introuvable.');
      setTimeout(() => this.errorSummary()?.nativeElement.focus());
      return;
    }

    // The control always holds a string (text input), but coerce defensively in
    // case a numeric value ever reaches it (e.g. programmatic setValue).
    const rawYear = String(value.year ?? '').trim();
    const year = rawYear === '' ? undefined : Number(rawYear);
    const input: VehicleInput = {
      plate: value.plate,
      make: value.make,
      model: value.model,
      year,
      clientId: value.clientId,
    };

    this.loading.set(true);
    if (this.isEdit) {
      const updated = this.vehicles.update(this.vehicleId as string, input);
      this.loading.set(false);
      if (!updated) {
        this.error.set("Ce véhicule n'existe plus.");
        setTimeout(() => this.errorSummary()?.nativeElement.focus());
        return;
      }
      this.success.set('Véhicule modifié avec succès.');
      setTimeout(
        () => void this.router.navigate(['/vehicules', this.vehicleId as string]).catch(() => undefined),
        900
      );
      return;
    }

    const created = this.vehicles.create(input);
    this.loading.set(false);
    this.success.set('Véhicule créé avec succès.');
    setTimeout(
      () => void this.router.navigate(['/vehicules', created.id]).catch(() => undefined),
      900
    );
  }
}
