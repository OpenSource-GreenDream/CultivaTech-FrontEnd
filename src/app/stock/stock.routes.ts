import { Routes } from '@angular/router';

export const STOCK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/views/supply-registration/supply-registration').then(
        (m) => m.SupplyRegistration,
      ),
  },
];
