import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {catchError, map, of} from 'rxjs';
import {AuthService} from '../../iam/application/auth.service';
import {ProfileContextService} from '../application/profile-context.service';
import {isProfileComplete} from '../domain/model/profile.entity';

export const profileCompleteGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const profileContext = inject(ProfileContextService);
  const router = inject(Router);

  const currentUser = authService.currentUser();
  if (!currentUser) {
    return router.createUrlTree(['/sign-in']);
  }

  const activeProfile = profileContext.currentProfile();
  if (activeProfile && isProfileComplete(activeProfile, authService.currentUserRoles() as readonly string[])) {
    return true;
  }

  return profileContext.fetchCurrentProfile().pipe(
    map((profile) => (profile && isProfileComplete(profile, authService.currentUserRoles() as readonly string[])
      ? true
      : router.createUrlTree(['/profile/create']))),
    catchError((error) => {
      if (error?.status === 404) {
        return of(router.createUrlTree(['/profile/create']));
      }
      return of(true);
    }),
  );
};