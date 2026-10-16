import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Paramètres</h1>
        <p class="mt-1 text-sm text-slate-500">
          Espace réservé à l'administration de l'application.
        </p>
      </div>

      <div class="rounded-lg bg-white p-6 shadow">
        <p class="text-sm text-slate-600">
          Cette page n'est accessible qu'aux comptes possédant l'autorisation
          <code class="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800">settings:manage</code>,
          c'est-à-dire le rôle <span class="font-medium text-slate-800">Administrateur</span>.
        </p>
      </div>
    </div>
  `,
})
export class Settings {}
