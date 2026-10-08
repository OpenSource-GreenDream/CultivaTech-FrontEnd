import { Routes } from '@angular/router';
import { authenticationGuard } from './iam/infrastructure/authentication.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'sign-in',
  },

  // Public Routes: IAM
  {
    path: 'sign-in',
    loadComponent: () => import('./iam/presentation/views/sign-in/sign-in')
      .then((view) => view.SignIn),
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./iam/presentation/views/sign-up/sign-up')
      .then((view) => view.SignUp),
  },

  // Private Routes
  {
    path: '',
    canActivate: [authenticationGuard],
    loadComponent: () => import('./shared/presentation/components/layout/layout')
      .then((m) => m.Layout),
    children: [
      {
        path: 'dashboard',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () => import('./shared/presentation/views/home/home')
          .then((m) => m.Home),
      },
      {
        path: 'notifications',
        loadChildren: () => import('./notification/notification.routes')
          .then((routes) => routes.NOTIFICATION_ROUTES),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/presentation/views/profile-management/profile-management')
            .then((m) => m.ProfileManagementComponent),
      },
      {
        path: 'stock',
        loadChildren: () =>
          import('./stock/stock.routes').then((routes) => routes.STOCK_ROUTES),
      },
      {
        path: 'monitoring',
        loadComponent: () => import('./monitoring/presentation/views/device-monitoring/device-monitoring')
          .then((m) => m.DeviceMonitoring),
      },
      {
        path: 'analytics',
        loadChildren: () =>
          import('./analytics/components/analytics-dashboard/analytics-dashboard').then((m) => m.AnalyticsDashboardComponent),
      }
      // Other Bounded Contexts
    ],
  },

  {
    path: '**',
    redirectTo: 'sign-in',
  },
];
