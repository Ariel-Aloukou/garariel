import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ClientService } from '../../../core/services/client.service';
import { AuthorizationService } from '../../../core/services/authorization.service';

@Component({
  selector: 'app-vehicle-detail',
  imports: [RouterLink],
  templateUrl: './vehicle-detail.html',
})
export class VehicleDetail {
  private readonly vehicles = inject(VehicleService);
  private readonly clients = inject(ClientService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly authz = inject(AuthorizationService);

  private readonly vehicleId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly vehicle = computed(() => this.vehicles.getById(this.vehicleId));
  /** Owner client resolved live; `undefined` when it no longer exists. */
  readonly owner = computed(() => {
    const vehicle = this.vehicle();
    return vehicle ? this.clients.getById(vehicle.clientId) : undefined;
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
    if (this.vehicles.delete(this.vehicleId)) {
      this.confirming.set(false);
      this.deleted.set(true);
      setTimeout(() => void this.router.navigate(['/vehicules']).catch(() => undefined), 900);
    }
  }
}
