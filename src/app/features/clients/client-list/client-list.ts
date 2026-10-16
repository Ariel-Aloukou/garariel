import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { AuthorizationService } from '../../../core/services/authorization.service';

@Component({
  selector: 'app-client-list',
  imports: [RouterLink],
  templateUrl: './client-list.html',
})
export class ClientList {
  readonly clients = inject(ClientService);
  readonly authz = inject(AuthorizationService);

  onSearch(event: Event): void {
    this.clients.setQuery((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.clients.clearQuery();
  }
}
