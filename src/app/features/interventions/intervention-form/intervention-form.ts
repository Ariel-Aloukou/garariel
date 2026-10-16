import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InterventionService } from '../../../core/services/intervention.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ClientService } from '../../../core/services/client.service';
import { InterventionInput, InterventionStatus } from '../../../data-access/intervention.models';
import { INTERVENTION_STATUS_OPTIONS } from '../intervention-status';

/** ISO date, rejecting impossible calendar dates (e.g. 2026-02-31). Empty is left to `required`. */
function isoDate(control: AbstractControl): ValidationErrors | null {
  const raw = String(control.value ?? '').trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { date: true };

  const [year, month, day] = raw.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const roundTrip = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}-${String(
    parsed.getUTCDate()
  ).padStart(2, '0')}`;
  return roundTrip === raw ? null : { date: true };
}

/** Optional cost: a non-negative number with at most two decimals (`.` or `,` separator). */
function costFormat(control: AbstractControl): ValidationErrors | null {
  const raw = String(control.value ?? '').trim();
  if (!raw) return null;
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(raw)) return { cost: true };
  const value = Number(raw.replace(',', '.'));
  if (!Number.isFinite(value) || value < 0) return { cost: true };
  return null;
}

type FieldName = 'vehicleId' | 'date' | 'problem' | 'diagnosis' | 'workDone' | 'cost' | 'status';

@Component({
  selector: 'app-intervention-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './intervention-form.html',
})
export class InterventionForm {
  private readonly fb = inject(FormBuilder);
  private readonly interventions = inject(InterventionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');

  readonly vehicles = inject(VehicleService);
  readonly clients = inject(ClientService);
  readonly statusOptions = INTERVENTION_STATUS_OPTIONS;

  private readonly interventionId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = this.interventionId !== null;
  readonly intervention = this.isEdit
    ? this.interventions.getById(this.interventionId as string)
    : undefined;
  readonly notFound = this.isEdit && !this.intervention;
  /** Editing an intervention whose vehicle no longer exists. */
  readonly vehicleMissing = !!this.intervention && !this.vehicles.getById(this.intervention.vehicleId);

  readonly form = this.fb.nonNullable.group({
    vehicleId: ['', Validators.required],
    date: ['', [Validators.required, isoDate]],
    problem: ['', Validators.required],
    diagnosis: [''],
    workDone: [''],
    cost: ['', costFormat],
    status: ['pending', Validators.required],
  });

  private readonly selectedVehicleId = signal(this.form.controls.vehicleId.value);
  readonly selectedVehicle = computed(() => this.vehicles.getById(this.selectedVehicleId()));
  readonly selectedOwner = computed(() => {
    const vehicle = this.selectedVehicle();
    return vehicle ? this.clients.getById(vehicle.clientId) : undefined;
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly showSummary = signal(false);

  constructor() {
    this.form.controls.vehicleId.valueChanges.subscribe((id) => this.selectedVehicleId.set(id));

    if (this.intervention) {
      this.form.setValue({
        vehicleId: this.intervention.vehicleId,
        date: this.intervention.date,
        problem: this.intervention.problem,
        diagnosis: this.intervention.diagnosis ?? '',
        workDone: this.intervention.workDone ?? '',
        cost: this.intervention.cost === undefined ? '' : String(this.intervention.cost),
        status: this.intervention.status,
      });
    }
  }

  message(field: FieldName): string | null {
    const control = this.form.controls[field];
    if (!control.touched && !this.showSummary()) return null;
    if (field === 'date' && control.hasError('date')) {
      return 'Date invalide (format attendu AAAA-MM-JJ).';
    }
    if (field === 'cost' && control.hasError('cost')) {
      return 'Coût invalide (nombre positif, deux décimales au maximum).';
    }
    if (field === 'vehicleId' && control.hasError('unknownVehicle')) {
      return 'Ce véhicule est introuvable.';
    }
    if (control.hasError('required')) {
      if (field === 'vehicleId') return 'Le véhicule est requis.';
      if (field === 'date') return 'La date est requise.';
      if (field === 'problem') return 'La description du problème est requise.';
      return 'Ce champ est requis.';
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
    if (!this.vehicles.getById(value.vehicleId)) {
      this.form.controls.vehicleId.setErrors({ unknownVehicle: true });
      this.form.controls.vehicleId.markAsTouched();
      this.showSummary.set(true);
      this.error.set('Le véhicule sélectionné est introuvable.');
      setTimeout(() => this.errorSummary()?.nativeElement.focus());
      return;
    }

    const rawCost = String(value.cost ?? '')
      .trim()
      .replace(',', '.');
    const input: InterventionInput = {
      vehicleId: value.vehicleId,
      date: value.date.trim(),
      problem: value.problem,
      diagnosis: value.diagnosis.trim() || undefined,
      workDone: value.workDone.trim() || undefined,
      cost: rawCost === '' ? undefined : Number(rawCost),
      status: value.status as InterventionStatus,
    };

    this.loading.set(true);
    if (this.isEdit) {
      const updated = this.interventions.update(this.interventionId as string, input);
      this.loading.set(false);
      if (!updated) {
        this.error.set("Cette intervention n'existe plus.");
        setTimeout(() => this.errorSummary()?.nativeElement.focus());
        return;
      }
      this.success.set('Intervention modifiée avec succès.');
      setTimeout(
        () =>
          void this.router
            .navigate(['/interventions', this.interventionId as string])
            .catch(() => undefined),
        900
      );
      return;
    }

    const created = this.interventions.create(input);
    this.loading.set(false);
    this.success.set('Intervention créée avec succès.');
    setTimeout(() => void this.router.navigate(['/interventions', created.id]).catch(() => undefined), 900);
  }
}
