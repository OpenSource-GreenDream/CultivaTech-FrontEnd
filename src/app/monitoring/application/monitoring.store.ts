import {computed, inject, Service, signal} from '@angular/core';
import {AuthService} from '../../iam/application/auth.service';
import {Device} from '../domain/model/device.entity';
import {FieldApi} from '../../profile/infrastructure/field-api';
import {DeviceApi} from '../infrastructure/device-api';
import {Field} from '../../profile/domain/model/field.entity';
import {catchError, forkJoin, map, Observable, tap, throwError} from 'rxjs';
import {DeviceAssembler} from '../infrastructure/device.assembler';
import {FieldAssembler} from '../../profile/infrastructure/field.assembler';
import {AnalyticsApi} from '../../analytics/infrastructure/analytics-api';
import {AnalyticsReport} from '../../analytics/domain/model/entity/analytics-report';

@Service()
export class MonitoringStore{
  private readonly deviceApi = inject(DeviceApi);
  private readonly fieldApi = inject(FieldApi);
  private readonly analyticsApi = inject(AnalyticsApi);
  private readonly authService = inject(AuthService);

  private readonly _devices = signal<Device[]>([]);
  readonly fields = signal<Field[]>([]);
  readonly reports = signal<AnalyticsReport[]>([]);
  readonly loading = signal<boolean>(false);
  readonly selectedFieldId = signal<number | null>(null);

  readonly devices = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this._devices();
  });

  readonly filteredDevices = computed(() => {
    const fieldId = this.selectedFieldId();
    const list = this.devices();
    if (fieldId === null) return list;
    return list.filter((device) => device.fieldId === fieldId);
  });

  loadMonitoringData(): Observable<void> {
    this.loading.set(true);

    return forkJoin({
      fieldsRaw: this.fieldApi.getFields(),
      devicesRaw: this.deviceApi.getDevices(),
      reportsRaw: this.analyticsApi.getAllReports(),
    }).pipe(
      tap(({ fieldsRaw, devicesRaw, reportsRaw }) => {
        this.fields.set(fieldsRaw.map(FieldAssembler.toEntityFromResource));
        this._devices.set(devicesRaw.map(DeviceAssembler.toEntityFromResource));

        const monitoringReports: AnalyticsReport[] = reportsRaw.map((resource) => ({
          id: resource.id,
          deviceId: resource.device_id,
          generatedAt: resource.generated_at,
          meanValue: resource.mean_value,
          variance: resource.variance,
          standardDeviation: resource.standard_deviation,
          technicalInterpretation: resource.technical_interpretation,
          createdAt: resource.created_at,
          updatedAt: resource.updated_at,
        }));

        this.reports.set(monitoringReports);
        this.loading.set(false);
      }),
      map(() => void 0),
      catchError((error) => {
        this.loading.set(false);
        console.error('Error cargando los datos de monitoreo:', error);
        return throwError(() => error);
      })
    );
  }

  setSelectedField(fieldId: number | null): void {
    this.selectedFieldId.set(fieldId);
  }
}
