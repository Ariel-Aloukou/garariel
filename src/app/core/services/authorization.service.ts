import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type Permission = string;

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  administrateur: [
    'clients:read',
    'clients:write',
    'workshop:read',
    'workshop:manage',
    'pieces:read',
    'pieces:manage',
    'devis:read',
    'devis:manage',
    'factures:read',
    'factures:manage',
    'dashboard:read',
    'settings:manage',
  ],
  employe: [
    'clients:read',
    'workshop:read',
    'workshop:manage',
    'pieces:read',
    'dashboard:read',
  ],
};

@Injectable({ providedIn: 'root' })
export class AuthorizationService {
  private readonly auth = inject(AuthService);

  readonly role = this.auth.currentRole;
  readonly permissions = computed(() => {
    const r = this.auth.currentRole();
    if (!r) return [] as Permission[];
    return ROLE_PERMISSIONS[r] ?? [];
  });

  hasPermission(permission: Permission): boolean {
    if (!this.auth.isAuthenticated()) return false;
    return this.permissions().includes(permission);
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    if (!permissions.length) return true;
    return permissions.some((p) => this.hasPermission(p));
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    if (!permissions.length) return true;
    return permissions.every((p) => this.hasPermission(p));
  }
}
