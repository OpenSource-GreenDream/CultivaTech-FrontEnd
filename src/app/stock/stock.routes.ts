import { Routes } from '@angular/router';

export const STOCK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/views/stock-movements/stock-movements').then((m) => m.StockMovements),
  },
];
