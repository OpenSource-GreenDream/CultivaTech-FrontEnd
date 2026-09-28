import { Routes } from '@angular/router';
import { authenticationGuard } from './iam/infrastructure/authentication.guard';

export const routes: Routes = [
  {
    path: 'notifications',
    canActivate: [authenticationGuard],
    loadChildren: () => import('./notification/notification.routes')
      .then((routes) => routes.NOTIFICATION_ROUTES),
  },
];
