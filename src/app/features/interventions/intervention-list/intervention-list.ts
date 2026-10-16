import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InterventionService, StatusFilter } from '../../../core/services/intervention.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ClientService } from '../../../core/services/client.service';
import { AuthorizationService } from '../../../core/services/authorization.service';
import { Intervention, InterventionStatus } from '../../../data-access/intervention.models';
import {
  INTERVENTION_STATUS_BADGE_CLASSES,
  INTERVENTION_STATUS_LABELS,
  INTERVENTION_STATUS_OPTIONS,
} from '../intervention-status';

@Component({
  selector: 'app-intervention-list',
  imports: [RouterLink],
  templateUrl: './intervention-list.html',
})
export class InterventionList {
  readonly interventions = inject(InterventionService);
  readonly authz = inject(AuthorizationService);
  readonly statusOptions = INTERVENTION_STATUS_OPTIONS;
  private readonly vehicles = inject(VehicleService);
  private readonly clients = inject(ClientService);

  statusLabel(status: InterventionStatus): string {
    return INTERVENTION_STATUS_LABELS[status];
  }

  statusClasses(status: InterventionStatus): string {
    return INTERVENTION_STATUS_BADGE_CLASSES[status];
  }

  /** Resolves the attached vehicle, tolerating one that no longer exists. */
  vehicleLabel(intervention: Intervention): string {
    const vehicle = this.vehicles.getById(intervention.vehicleId);
    return vehicle ? `${vehicle.plate} — ${vehicle.make} ${vehicle.model}` : 'Véhicule introuvable';
  }

  vehicleMissing(intervention: Intervention): boolean {
    return !this.vehicles.getById(intervention.vehicleId);
  }

  /** Resolves the owner of the attached vehicle, tolerating a missing vehicle or client. */
  ownerName(intervention: Intervention): string {
    const owner = this.owner(intervention);
    return owner ? owner.fullName : 'Propriétaire introuvable';
  }

  ownerId(intervention: Intervention): string | undefined {
    return this.owner(intervention)?.id;
  }

  ownerMissing(intervention: Intervention): boolean {
    return !this.owner(intervention);
  }

  costLabel(intervention: Intervention): string {
    return intervention.cost === undefined ? '—' : `${intervention.cost.toFixed(2)} €`;
  }

  onSearch(event: Event): void {
    this.interventions.setQuery((event.target as HTMLInputElement).value);
  }

  onStatusFilter(event: Event): void {
    this.interventions.setStatusFilter((event.target as HTMLSelectElement).value as StatusFilter);
  }

  onDateFrom(event: Event): void {
    this.interventions.setDateFrom((event.target as HTMLInputElement).value);
  }

  onDateTo(event: Event): void {
    this.interventions.setDateTo((event.target as HTMLInputElement).value);
  }

  clearFilters(): void {
    this.interventions.clearFilters();
  }

  private owner(intervention: Intervention) {
    const vehicle = this.vehicles.getById(intervention.vehicleId);
    return vehicle ? this.clients.getById(vehicle.clientId) : undefined;
  }
}
