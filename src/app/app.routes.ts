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
      // Other Bounded Contexts
    ],
  },

  {
    path: '**',
    redirectTo: 'sign-in',
  },
];
