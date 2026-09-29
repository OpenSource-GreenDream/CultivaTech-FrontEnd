import { Routes } from '@angular/router';
import { notificationAuthenticationGuard } from './notification/infrastructure/notification-authentication.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'sign-in',
  },
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./iam/presentation/views/sign-in/sign-in').then((view) => view.SignIn),
  },
  {
    path: 'sign-up',
    loadComponent: () =>
      import('./iam/presentation/views/sign-up/sign-up').then((view) => view.SignUp),
  },
  {
    path: 'dashboard',
    pathMatch: 'full',
    redirectTo: 'notifications',
  },
  {
    path: 'notifications',
    canActivate: [notificationAuthenticationGuard],
    loadChildren: () =>
      import('./notification/notification.routes').then((routes) => routes.NOTIFICATION_ROUTES),
  },
  {
    path: 'analytics/dashboard',
    loadComponent: () =>
      import('./analytics/components/analytics-dashboard/analytics-dashboard').then(
        (m) => m.AnalyticsDashboardComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'sign-in',
  },
];
