import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AuthorizationService } from '../../core/services/authorization.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Tableau de bord</h1>
        <p class="mt-1 text-sm text-slate-500">Bienvenue, {{ auth.currentIdentifier() }}.</p>
      </div>

      <div class="rounded-lg bg-white p-6 shadow">
        <h2 class="text-lg font-semibold text-slate-900">Autorisations du rôle</h2>
        <p class="mt-1 text-sm text-slate-500">
          Rôle courant : <span class="font-medium text-slate-700">{{ auth.currentRole() }}</span>
        </p>
        <ul class="mt-4 flex flex-wrap gap-2">
          @for (permission of authz.permissions(); track permission) {
            <li class="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{{ permission }}</li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class Home {
  readonly auth = inject(AuthService);
  readonly authz = inject(AuthorizationService);
}
