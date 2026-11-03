import { CanActivateFn } from '@angular/router';
import { authenticationGuard } from '../../iam/infrastructure/authentication.guard';

export const notificationAuthenticationGuard: CanActivateFn = (route, state) => {
  return authenticationGuard(route, state);
};
