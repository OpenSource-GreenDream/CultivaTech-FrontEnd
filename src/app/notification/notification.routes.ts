import { Routes } from '@angular/router';

export const NOTIFICATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentation/views/notification-list/notification-list')
      .then((view) => view.NotificationList),
  },
  {
    path: 'preferences',
    loadComponent: () => import('./presentation/views/notification-preferences/notification-preferences')
      .then((view) => view.NotificationPreferences),
  },
];
