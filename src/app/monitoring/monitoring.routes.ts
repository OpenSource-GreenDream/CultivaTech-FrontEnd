import { Routes } from '@angular/router';

export const MONITORING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/views/sensor-monitoring/sensor-monitoring').then(
        (m) => m.SensorMonitoring,
      ),
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
  {
    path: 'sensor-history',
    loadComponent: () =>
      import('./presentation/views/sensor-history/sensor-history').then((m) => m.SensorHistory),
  },
];
