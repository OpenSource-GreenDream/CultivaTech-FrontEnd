import { Routes } from '@angular/router';

export const STOCK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentation/views/stock-management/stock-management')
      .then((m) => m.StockManagement),
  },
  {
    path: 'create-supply',
    loadComponent: () => import('./presentation/views/create-supply/create-supply')
      .then((m) => m.CreateSupply),
  },
  {
    path: 'catalog',
    loadComponent: () => import('./presentation/views/product-catalog/product-catalog')
      .then((m) => m.ProductCatalog),
  }
];
