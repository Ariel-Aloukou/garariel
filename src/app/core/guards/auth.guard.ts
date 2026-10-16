import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthorizationService } from '../services/authorization.service';

function buildLoginRedirect(router: Router, state: { url: string }): UrlTree {
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
}

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  return buildLoginRedirect(router, state);
};

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const authz = inject(AuthorizationService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return buildLoginRedirect(router, state);
  }

  const required = route.data?.['permission'] || route.data?.['permissions'];
  if (!required) {
    return true;
  }

  const permissions: string[] = Array.isArray(required) ? required : [required];
  if (authz.hasAnyPermission(permissions)) {
    return true;
  }

  return router.createUrlTree(['/acces-refuse']);
};
