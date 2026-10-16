import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

export const clientsRoutes: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { permission: 'clients:read' },
    loadComponent: () => import('./client-list/client-list').then((m) => m.ClientList),
  },
  {
    path: 'nouveau',
    canActivate: [roleGuard],
    data: { permission: 'clients:write' },
    loadComponent: () => import('./client-form/client-form').then((m) => m.ClientForm),
  },
  {
    path: ':id/modifier',
    canActivate: [roleGuard],
    data: { permission: 'clients:write' },
    loadComponent: () => import('./client-form/client-form').then((m) => m.ClientForm),
  },
  {
    path: ':id',
    canActivate: [roleGuard],
    data: { permission: 'clients:read' },
    loadComponent: () => import('./client-detail/client-detail').then((m) => m.ClientDetail),
  },
];
