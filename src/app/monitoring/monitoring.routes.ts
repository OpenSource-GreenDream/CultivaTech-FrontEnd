import { Routes } from '@angular/router';

export const MONITORING_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'sensors',
    pathMatch: 'full',
  },
  {
    path: 'sensors',
    loadComponent: () =>
      import('./presentation/views/sensor-list/sensor-list').then((m) => m.SensorList),
  },
  {
    path: 'sensors/register',
    loadComponent: () =>
      import('./presentation/views/sensor-register/sensor-register').then((m) => m.SensorRegister),
  },
];
