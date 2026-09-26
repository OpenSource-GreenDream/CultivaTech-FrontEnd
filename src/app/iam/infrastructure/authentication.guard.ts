import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../application/auth.service';

//TODO: implements Guard in app.routes when sprint 2 end
/**
 * This is a Guard to block application to anonymous users.
 * @param route target route.
 * @param state current route.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export const authenticationGuard: CanActivateFn = (route, state) =>{
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAnonymous = !authService.isSignedIn();
  const publicRoutes = ['/sign-in', '/sign-up', '/404'];

  const routesRequiresToBeAuthenticated = !publicRoutes.includes(state.url);

  if (isAnonymous && routesRequiresToBeAuthenticated){
    return router.createUrlTree(['/sign-in']);
  }

  return true;
}
