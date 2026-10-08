import {computed, inject, Service, signal} from '@angular/core';
import {AnalyticsReport} from '../domain/model/entity/analytics-report';
import {KeyIndicators} from '../domain/model/valueobjects/key-indicators';
import {catchError, map, Observable, tap, throwError} from 'rxjs';
import {DeviceAssembler} from '../../monitoring/infrastructure/device.assembler';
import {DeviceApi} from '../../monitoring/infrastructure/device-api';
import {AuthService} from '../../iam/application/auth.service';
import {Device} from '../../monitoring/domain/model/device.entity';
import {AnalyticsContext} from './analytics-context.store';

@Service()
export class AnalyticsStore {
  private readonly analyticsContext = inject(AnalyticsContext);
  private readonly deviceApi = inject(DeviceApi);
  private readonly authService = inject(AuthService);

  private readonly _devices = signal<Device[]>([]);
  readonly reports = signal<AnalyticsReport[]>([]);
  readonly selectedDeviceId = signal<number | null>(null);
  readonly loading = signal<boolean>(false);

  readonly userDevices = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this._devices();
  });

  readonly indicators = computed<KeyIndicators>(() => {
    const reportsList = this.reports();
    const total = reportsList.length;

    if (total === 0) {
      return {
        averageMean: 0,
        averageVariance: 0,
        averageDeviation: 0,
        totalReports: 0,
        status: 'No Data',
      };
    }

    const sumMean = reportsList.reduce((acc, r) => acc + r.meanValue, 0);
    const sumVariance = reportsList.reduce((acc, r) => acc + r.variance, 0);
    const sumDev = reportsList.reduce((acc, r) => acc + r.standardDeviation, 0);

    const avgVariance = +(sumVariance / total).toFixed(2);

    return {
      averageMean: +(sumMean / total).toFixed(2),
      averageVariance: avgVariance,
      averageDeviation: +(sumDev / total).toFixed(2),
      totalReports: total,
      status: avgVariance > 3.0 ? 'Alert' : 'Optimal',
    };
  });

  initAnalyticsData(): Observable<void> {
    this.loading.set(true);

    return this.deviceApi.getDevices().pipe(
      tap((resources) => {
        const devices = resources.map(DeviceAssembler.toEntityFromResource);
        this._devices.set(devices);

        if (devices.length > 0) {
          const firstDeviceId = devices[0].id;
          this.selectedDeviceId.set(firstDeviceId);
          this.loadReportsForDevice(firstDeviceId);
        } else {
          this.loading.set(false);
        }
      }),
      map(() => void 0),
      catchError((err) => {
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  selectDevice(deviceId: number): void {
    if (this.selectedDeviceId() === deviceId) return;
    this.selectedDeviceId.set(deviceId);
    this.loadReportsForDevice(deviceId);
  }

  private loadReportsForDevice(deviceId: number): void {
    this.loading.set(true);
    this.analyticsContext.getReportByDeviceId(deviceId).subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar analítica:', err);
        this.reports.set([]);
        this.loading.set(false);
      },
    });
  }
}
