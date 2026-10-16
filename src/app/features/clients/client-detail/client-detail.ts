import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { AuthorizationService } from '../../../core/services/authorization.service';

@Component({
  selector: 'app-client-detail',
  imports: [RouterLink],
  templateUrl: './client-detail.html',
})
export class ClientDetail {
  private readonly clients = inject(ClientService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly authz = inject(AuthorizationService);

  private readonly clientId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly client = computed(() => this.clients.getById(this.clientId));
  readonly confirming = signal(false);
  readonly deleted = signal(false);

  requestDelete(): void {
    this.confirming.set(true);
  }

  cancelDelete(): void {
    this.confirming.set(false);
  }

  confirmDelete(): void {
    if (this.clients.delete(this.clientId)) {
      this.confirming.set(false);
      this.deleted.set(true);
      setTimeout(() => void this.router.navigate(['/clients']).catch(() => undefined), 900);
    }
  }
}
