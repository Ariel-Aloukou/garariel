import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

export const vehiculesRoutes: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { permission: 'workshop:read' },
    loadComponent: () => import('./vehicle-list/vehicle-list').then((m) => m.VehicleList),
  },
  {
    path: 'nouveau',
    canActivate: [roleGuard],
    data: { permission: 'workshop:manage' },
    loadComponent: () => import('./vehicle-form/vehicle-form').then((m) => m.VehicleForm),
  },
  {
    path: ':id/modifier',
    canActivate: [roleGuard],
    data: { permission: 'workshop:manage' },
    loadComponent: () => import('./vehicle-form/vehicle-form').then((m) => m.VehicleForm),
  },
  {
    path: ':id',
    canActivate: [roleGuard],
    data: { permission: 'workshop:read' },
    loadComponent: () => import('./vehicle-detail/vehicle-detail').then((m) => m.VehicleDetail),
  },
];
