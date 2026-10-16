import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

export const interventionsRoutes: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { permission: 'workshop:read' },
    loadComponent: () =>
      import('./intervention-list/intervention-list').then((m) => m.InterventionList),
  },
  {
    path: 'nouveau',
    canActivate: [roleGuard],
    data: { permission: 'workshop:manage' },
    loadComponent: () =>
      import('./intervention-form/intervention-form').then((m) => m.InterventionForm),
  },
  {
    path: ':id/modifier',
    canActivate: [roleGuard],
    data: { permission: 'workshop:manage' },
    loadComponent: () =>
      import('./intervention-form/intervention-form').then((m) => m.InterventionForm),
  },
  {
    path: ':id',
    canActivate: [roleGuard],
    data: { permission: 'workshop:read' },
    loadComponent: () =>
      import('./intervention-detail/intervention-detail').then((m) => m.InterventionDetail),
  },
];
