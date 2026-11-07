import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../application/auth.service';

/**
 * Guard to block application access to anonymous users and enforce role-based route metadata..
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export const authenticationGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isSignedIn()) {
    return router.createUrlTree(['/sign-in']);
  }

  const allowedRoles = route.data?.['roles'] as readonly string[] | undefined;
  if (allowedRoles && allowedRoles.length > 0 && !authService.hasAnyRole(allowedRoles)) {
    return router.createUrlTree(['/home']);
  }

  return true;
};
