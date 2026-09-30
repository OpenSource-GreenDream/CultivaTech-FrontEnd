import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../application/auth.service';

/**
 * This is a Guard to block application to anonymous users.
 * @param route target route.
 * @param state current route.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export const authenticationGuard: CanActivateFn = (route, state) =>{
  const authService = inject(AuthService);
  const router = inject(Router);

  if(authService.isSignedIn()){
    return true;
  }

  return router.createUrlTree(['/sign-in']);
}
