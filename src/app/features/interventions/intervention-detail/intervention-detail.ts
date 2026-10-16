import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InterventionService } from '../../../core/services/intervention.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ClientService } from '../../../core/services/client.service';
import { AuthorizationService } from '../../../core/services/authorization.service';
import {
  INTERVENTION_STATUS_BADGE_CLASSES,
  INTERVENTION_STATUS_LABELS,
} from '../intervention-status';

@Component({
  selector: 'app-intervention-detail',
  imports: [RouterLink],
  templateUrl: './intervention-detail.html',
})
export class InterventionDetail {
  private readonly interventions = inject(InterventionService);
  private readonly vehicles = inject(VehicleService);
  private readonly clients = inject(ClientService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly authz = inject(AuthorizationService);

  private readonly interventionId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly intervention = computed(() => this.interventions.getById(this.interventionId));
  /** Attached vehicle resolved live; `undefined` when it no longer exists. */
  readonly vehicle = computed(() => {
    const intervention = this.intervention();
    return intervention ? this.vehicles.getById(intervention.vehicleId) : undefined;
  });
  /** Owner client resolved live; `undefined` when it no longer exists. */
  readonly owner = computed(() => {
    const vehicle = this.vehicle();
    return vehicle ? this.clients.getById(vehicle.clientId) : undefined;
  });

  readonly statusLabel = computed(() => {
    const intervention = this.intervention();
    return intervention ? INTERVENTION_STATUS_LABELS[intervention.status] : '';
  });
  readonly statusClasses = computed(() => {
    const intervention = this.intervention();
    return intervention ? INTERVENTION_STATUS_BADGE_CLASSES[intervention.status] : '';
  });
  readonly costLabel = computed(() => {
    const intervention = this.intervention();
    return intervention && intervention.cost !== undefined ? `${intervention.cost.toFixed(2)} €` : '—';
  });

  readonly confirming = signal(false);
  readonly deleted = signal(false);

  requestDelete(): void {
    this.confirming.set(true);
  }

  cancelDelete(): void {
    this.confirming.set(false);
  }

  confirmDelete(): void {
    if (this.interventions.delete(this.interventionId)) {
      this.confirming.set(false);
      this.deleted.set(true);
      setTimeout(() => void this.router.navigate(['/interventions']).catch(() => undefined), 900);
    }
  }
}
