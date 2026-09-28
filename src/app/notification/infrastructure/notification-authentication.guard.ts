import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../../iam/application/auth.service';
import { IamStore } from '../../iam/application/iam.store';
import { authenticationGuard } from '../../iam/infrastructure/authentication.guard';

export const notificationAuthenticationGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const iamStore = inject(IamStore);
  const authenticatedUser = iamStore.user();

  if (authService.currentUser() === null && authenticatedUser !== null) {
    authService.currentUser.set(authenticatedUser);
  }

  return authenticationGuard(route, state);
};
