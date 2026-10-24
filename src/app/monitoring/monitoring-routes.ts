import {Routes} from '@angular/router';

export const MONITORING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentation/views/device-monitoring/device-monitoring')
      .then((m) => m.DeviceMonitoring),
  },
  {
    path: 'sensor-history',
    loadComponent: () => import('./presentation/views/sensor-history/sensor-history')
      .then((m) => m.SensorHistory),
  },
  {
    path: 'create-device',
    loadComponent: () => import('./presentation/views/create-device/create-device')
      .then((m) => m.CreateDevice),
  }
];
