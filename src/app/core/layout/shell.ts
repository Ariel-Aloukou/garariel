import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { AuthorizationService } from '../services/authorization.service';

@Component({
  selector: 'app-shell',
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
    <div class="min-h-screen bg-slate-50">
      <header class="bg-slate-900 text-white shadow">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <nav class="flex gap-4" aria-label="Navigation principale">
            <a routerLink="/" class="rounded px-2 py-1 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400">Accueil</a>
            @if (authz.hasPermission('clients:read')) {
              <a routerLink="/clients" class="rounded px-2 py-1 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400">Clients</a>
            }
            @if (authz.hasPermission('workshop:read')) {
              <a routerLink="/vehicules" class="rounded px-2 py-1 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400">Véhicules</a>
            }
            @if (authz.hasPermission('workshop:read')) {
              <a routerLink="/interventions" class="rounded px-2 py-1 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400">Interventions</a>
            }
            @if (authz.hasPermission('workshop:read')) {
              <a routerLink="/" class="rounded px-2 py-1 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400">Atelier</a>
            }
            @if (authz.hasPermission('settings:manage')) {
              <a routerLink="/parametres" class="rounded px-2 py-1 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400">Paramètres</a>
            }
          </nav>
          <div class="flex items-center gap-4 text-sm">
            <span>{{ auth.currentIdentifier() }} ({{ auth.currentRole() }})</span>
            <button
              type="button"
              (click)="logout()"
              class="rounded bg-red-600 px-3 py-1 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      <main class="mx-auto max-w-7xl px-4 py-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class Shell {
  readonly auth = inject(AuthService);
  readonly authz = inject(AuthorizationService);

  logout(): void {
    this.auth.logout();
  }
}
