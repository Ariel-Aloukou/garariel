import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ClientService } from '../../../core/services/client.service';
import { AuthorizationService } from '../../../core/services/authorization.service';
import { Vehicle } from '../../../data-access/vehicle.models';

@Component({
  selector: 'app-vehicle-list',
  imports: [RouterLink],
  templateUrl: './vehicle-list.html',
})
export class VehicleList {
  readonly vehicles = inject(VehicleService);
  readonly authz = inject(AuthorizationService);
  private readonly clients = inject(ClientService);

  /** Resolves the owner client name, tolerating a client that no longer exists. */
  clientName(vehicle: Vehicle): string {
    const client = this.clients.getById(vehicle.clientId);
    return client ? client.fullName : 'Client introuvable';
  }

  ownerMissing(vehicle: Vehicle): boolean {
    return !this.clients.getById(vehicle.clientId);
  }

  onSearch(event: Event): void {
    this.vehicles.setQuery((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.vehicles.clearQuery();
  }
}
