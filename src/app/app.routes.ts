import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'acces-refuse',
    loadComponent: () => import('./features/auth/access-refuse').then((m) => m.AccessRefuse),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/shell').then((m) => m.Shell),
    children: [
      { path: '', loadComponent: () => import('./features/home/home').then((m) => m.Home) },
      {
        path: 'clients',
        loadChildren: () => import('./features/clients/clients.routes').then((m) => m.clientsRoutes),
      },
      {
        path: 'vehicules',
        loadChildren: () => import('./features/vehicules/vehicules.routes').then((m) => m.vehiculesRoutes),
      },
      {
        path: 'interventions',
        loadChildren: () =>
          import('./features/interventions/interventions.routes').then((m) => m.interventionsRoutes),
      },
      {
        path: 'parametres',
        canActivate: [roleGuard],
        data: { permission: 'settings:manage' },
        loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
