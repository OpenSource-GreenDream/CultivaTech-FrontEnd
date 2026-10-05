import { Routes } from '@angular/router';
import { notificationAuthenticationGuard } from './infrastructure/notification-authentication.guard';

export const NOTIFICATION_ROUTES: Routes = [
  {
    path: '',
    canActivate: [notificationAuthenticationGuard],
    loadComponent: () => import('./presentation/views/notification-list/notification-list')
      .then((view) => view.NotificationList),
  },
  {
    path: 'preferences',
    canActivate: [notificationAuthenticationGuard],
    loadComponent: () => import('./presentation/views/notification-preferences/notification-preferences')
      .then((view) => view.NotificationPreferences),
  },
];
