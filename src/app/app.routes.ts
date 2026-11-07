import { Routes } from '@angular/router';
import { authenticationGuard } from './iam/infrastructure/authentication.guard';
import { profileCompleteGuard } from './profile/infrastructure/profile-complete.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
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
        path: 'profile/create',
        canActivate: [authenticationGuard],
        loadComponent: () =>
          import('./profile/presentation/views/profile-create/profile-create')
            .then((m) => m.ProfileCreateComponent),
      },
      {
        path: 'dashboard',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        canActivate: [authenticationGuard, profileCompleteGuard],
        loadComponent: () => import('./shared/presentation/views/home/home')
          .then((m) => m.Home),
      },
      {
        path: 'notifications',
        canActivate: [authenticationGuard, profileCompleteGuard],
        loadChildren: () => import('./notification/notification.routes')
          .then((routes) => routes.NOTIFICATION_ROUTES),
      },
      {
        path: 'profile',
        canActivate: [authenticationGuard, profileCompleteGuard],
        loadComponent: () =>
          import('./profile/presentation/views/profile-management/profile-management')
            .then((m) => m.ProfileManagementComponent),
      },
      {
        path: 'stock',
        canActivate: [authenticationGuard, profileCompleteGuard],
        loadChildren: () =>
          import('./stock/stock.routes').then((routes) => routes.STOCK_ROUTES),
      },
      {
        path: 'monitoring',
        canActivate: [authenticationGuard, profileCompleteGuard],
        loadChildren: () => import('./monitoring/monitoring-routes')
          .then((routes) => routes.MONITORING_ROUTES),
      },
      {
        path: 'analytics',
        canActivate: [authenticationGuard, profileCompleteGuard],
        loadComponent: () => import('./analytics/presentation/views/analytics-dashboard/analytics-dashboard')
          .then((m) => m.AnalyticsDashboardComponent),
      },
      {
        path: 'community',
        canActivate: [authenticationGuard, profileCompleteGuard],
        loadChildren: () => import('./community/community-routes')
          .then((routes) => routes.COMMUNITY_ROUTES),
      }
    ],
  },

  {
    path: '**',
    redirectTo: 'sign-in',
  },
];
