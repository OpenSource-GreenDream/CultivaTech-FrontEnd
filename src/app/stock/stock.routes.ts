import { Routes } from '@angular/router';

export const STOCK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/views/stock-management/stock-management').then(
        (m) => m.StockManagement
      ),
  },
];
