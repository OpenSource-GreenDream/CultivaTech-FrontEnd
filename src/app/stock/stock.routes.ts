import { Routes } from '@angular/router';
import { authenticationGuard } from '../iam/infrastructure/authentication.guard';

export const STOCK_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authenticationGuard],
    data: { roles: ['ADMIN', 'FARMER'] },
    loadComponent: () => import('./presentation/views/stock-management/stock-management')
      .then((m) => m.StockManagement),
  },
  {
    path: 'create-supply',
    canActivate: [authenticationGuard],
    data: { roles: ['ADMIN', 'FARMER'] },
    loadComponent: () => import('./presentation/views/create-supply/create-supply')
      .then((m) => m.CreateSupply),
  },
  {
    path: 'catalog',
    loadComponent: () => import('./presentation/views/product-catalog/product-catalog')
      .then((m) => m.ProductCatalog),
  }
];
