import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-refuse',
  imports: [RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div class="w-full max-w-md space-y-4 rounded-lg bg-white p-6 text-center shadow">
        <h1 class="text-2xl font-semibold text-slate-900">Accès refusé</h1>
        <p class="text-sm text-slate-600">
          Vous n'avez pas les autorisations nécessaires pour afficher cette page.
        </p>
        <a
          routerLink="/"
          class="inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Retour à l'accueil
        </a>
      </div>
    </div>
  `,
})
export class AccessRefuse {}
