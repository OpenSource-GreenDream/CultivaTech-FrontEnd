import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {catchError, map, of} from 'rxjs';
import {AuthService} from '../../iam/application/auth.service';
import {ProfileContextService} from '../application/profile-context.service';

/**
 * Guard that verifies the authenticated user has an active farmer profile (US26).
 * Redirects to onboarding only when the API explicitly confirms that no profile exists;
 * transport errors never trigger a false redirect to profile creation.
 */
export const profileCompleteGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const profileContext = inject(ProfileContextService);
  const router = inject(Router);

  const currentUser = authService.currentUser();
  if (!currentUser) {
    return router.createUrlTree(['/sign-in']);
  }

  const activeProfile = profileContext.currentProfile();
  if (activeProfile && activeProfile.userId === currentUser.id) {
    return true;
  }

  return profileContext.fetchCurrentProfile().pipe(
    map((profile) => (profile ? true : router.createUrlTree(['/profile/create']))),
    catchError(() => of(true)),
  );
};
