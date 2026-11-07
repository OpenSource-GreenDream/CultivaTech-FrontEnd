import {computed, inject, Service, signal} from '@angular/core';
import {AuthService} from '../../iam/application/auth.service';
import {ProfileContextService} from '../../profile/application/profile-context.service';
import {Device} from '../domain/model/device.entity';
import {FieldApi} from '../../profile/infrastructure/field-api';
import {DeviceApi} from '../infrastructure/device-api';
import {Field} from '../../profile/domain/model/field.entity';
import {catchError, forkJoin, map, Observable, of, switchMap, tap, throwError} from 'rxjs';
import {DeviceAssembler} from '../infrastructure/device.assembler';
import {FieldAssembler} from '../../profile/infrastructure/field.assembler';
import {AnalyticsContext} from '../../analytics/application/analytics-context.store';
import {AnalyticsReport} from '../../analytics/domain/model/entity/analytics-report.entity';
import {CreateDeviceRequest} from '../domain/model/create-device.request';
import {SensorReading} from '../domain/model/sensor-reading.entity';
import {SensorReadingAssembler} from '../infrastructure/sensor-reading.assembler';
import {SensorReadingsApi} from '../infrastructure/sensor-readings-api';
import {
  evaluateTelemetryStatus,
  resolveParameterThreshold,
  TelemetryParameter,
  TelemetryStatus,
} from '../domain/model/telemetry-parameter';
import {NotificationApiService} from '../../notification/infrastructure/notification-api.service';
import {NotificationType} from '../../notification/domain/model/notification-type.enum';
import {TELEMETRY_ALERT_MESSAGES, TELEMETRY_ALERT_TYPE_KEYS} from '../domain/model/telemetry-alert.constants';
import {NotificationEventService} from '../../notification/application/notification-event.service';

export type TelemetryAlertStatus = TelemetryStatus;

export interface TelemetryAlertItem {
  deviceId: number;
  macAddress: string;
  fieldId: number;
  fieldName: string;
  parameter: TelemetryParameter;
  unit: string;
  meanValue: number;
  thresholdValue: number;
  status: TelemetryAlertStatus;
}

@Service()
export class MonitoringStore {
  private readonly deviceApi = inject(DeviceApi);
  private readonly sensorReadingsApi = inject(SensorReadingsApi);
  private readonly fieldApi = inject(FieldApi);
  private readonly analyticsContext = inject(AnalyticsContext);
  private readonly notificationApi = inject(NotificationApiService);
  private readonly notificationEvents = inject(NotificationEventService);
  private readonly authService = inject(AuthService);
  private readonly profileContext = inject(ProfileContextService);

  private readonly persistedAlertKeys = new Set<string>();

  private readonly _devices = signal<Device[]>([]);
  readonly fields = signal<Field[]>([]);
  readonly reports = signal<AnalyticsReport[]>([]);
  readonly readings = signal<SensorReading[]>([]);
  readonly loading = signal<boolean>(false);
  readonly selectedFieldId = signal<number | null>(null);

  readonly moistureThreshold = computed<number | null>(
    () => this.profileContext.currentProfile()?.moistureThreshold ?? null
  );

  readonly tempThreshold = computed<number | null>(
    () => this.profileContext.currentProfile()?.tempThreshold ?? null
  );

  readonly devices = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    const allowedFieldIds = new Set(this.fields().map(field => Number(field.id)));
    return this._devices().filter(device => allowedFieldIds.has(Number(device.fieldId)));
  });

  readonly filteredDevices = computed(() => {
    const fieldId = this.selectedFieldId();
    const list = this.devices();
    if (fieldId === null) return list;
    return list.filter((device) => Number(device.fieldId) === Number(fieldId));
  });

  readonly sortedReports = computed(() => {
    const allowedDeviceIds = new Set(this.devices().map(device => Number(device.id)));
    return [...this.reports()]
      .filter(report => allowedDeviceIds.has(Number(report.deviceId)))
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  });

  readonly filteredReports = computed(() => {
    const fieldId = this.selectedFieldId();
    const allSorted = this.sortedReports();
    if (fieldId === null) {
      return allSorted;
    }
    const fieldDeviceIds = new Set(
      this.devices()
        .filter(device => Number(device.fieldId) === Number(fieldId))
        .map(device => Number(device.id))
    );
    return allSorted.filter(report => fieldDeviceIds.has(Number(report.deviceId)));
  });

  /** Latest report per device and parameter (chronological order is guaranteed by `sortedReports`). */
  readonly latestReports = computed(() => {
    const latest = new Map<string, AnalyticsReport>();
    for (const report of this.sortedReports()) {
      const key = this.reportKey(report.deviceId, report.parameter);
      if (!latest.has(key)) {
        latest.set(key, report);
      }
    }
    return Array.from(latest.values());
  });

  readonly latestReportByDevice = computed(() => {
    const mapByDevice = new Map<number, AnalyticsReport>();
    for (const report of this.latestReports()) {
      const deviceId = Number(report.deviceId);
      if (!mapByDevice.has(deviceId)) {
        mapByDevice.set(deviceId, report);
      }
    }
    return mapByDevice;
  });

  readonly latestReadingsByDevice = computed(() => {
    const mapByDevice = new Map<number, SensorReading[]>();
    const latestByKey = new Map<string, SensorReading>();

    for (const reading of this.readings()) {
      const key = this.reportKey(reading.deviceId, reading.parameter);
      const current = latestByKey.get(key);
      if (!current || new Date(reading.recordedAt) > new Date(current.recordedAt)) {
        latestByKey.set(key, reading);
      }
    }

    for (const reading of latestByKey.values()) {
      const deviceId = Number(reading.deviceId);
      const deviceReadings = mapByDevice.get(deviceId) ?? [];
      deviceReadings.push(reading);
      mapByDevice.set(deviceId, deviceReadings);
    }

    return mapByDevice;
  });

  readonly activeAlerts = computed<TelemetryAlertItem[]>(() => {
    const fieldsList = this.fields();
    const alerts: TelemetryAlertItem[] = [];

    for (const report of this.latestReports()) {
      const status = this.evaluateReportStatus(report);
      if (status === 'OPTIMAL') continue;

      const device = this.devices().find(d => Number(d.id) === Number(report.deviceId));
      if (!device) continue;

      const field = fieldsList.find(f => Number(f.id) === Number(device.fieldId));

      alerts.push({
        deviceId: device.id,
        macAddress: device.macAddress,
        fieldId: device.fieldId,
        fieldName: field ? field.name : `${TELEMETRY_ALERT_TYPE_KEYS.FIELD_FALLBACK_PREFIX}${device.fieldId}`,
        parameter: report.parameter,
        unit: report.unit,
        meanValue: report.meanValue,
        thresholdValue: this.thresholdFor(report),
        status,
      });
    }

    return alerts;
  });

  constructor() {
    this.authService.registerCleanup(() => this.clearState());
  }

  clearState(): void {
    this._devices.set([]);
    this.fields.set([]);
    this.reports.set([]);
    this.readings.set([]);
    this.selectedFieldId.set(null);
    this.loading.set(false);
    this.persistedAlertKeys.clear();
  }

  /**
   * Evaluates a report strictly against the threshold of its own parameter (US16/US17).
   */
  evaluateReportStatus(report: AnalyticsReport | undefined): TelemetryAlertStatus {
    if (!report || !report.parameter) {
      return 'OPTIMAL';
    }
    return evaluateTelemetryStatus(report.parameter, Number(report.meanValue), this.thresholds());
  }

  /**
   * Resolves the threshold used by the alert evaluation for the report parameter.
   */
  thresholdFor(report: AnalyticsReport): number {
    return resolveParameterThreshold(report.parameter, this.thresholds());
  }

  private thresholds() {
    return {
      moisture: this.moistureThreshold(),
      temperature: this.tempThreshold(),
    };
  }

  loadMonitoringData(): Observable<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.clearState();
      return of(void 0);
    }

    this.loading.set(true);

    return this.profileContext.fetchCurrentProfile().pipe(
      switchMap((profile) => {
        if (!profile) {
          this.clearState();
          return of(void 0);
        }

        return this.fieldApi.getFields(profile.id).pipe(
          map((fieldsRaw) =>
            fieldsRaw
              .filter(field => Number(field.profile_id) === Number(profile.id))
              .map(FieldAssembler.toEntityFromResource)
          ),
          tap((userFields) => {
            this.fields.set(userFields);
          }),
          switchMap((userFields) => {
            if (userFields.length === 0) {
              this._devices.set([]);
              this.reports.set([]);
              this.readings.set([]);
              this.loading.set(false);
              return of(void 0);
            }

            const allowedFieldIds = new Set(userFields.map(f => Number(f.id)));
            const fieldIds = userFields.map(f => Number(f.id));

            return this.deviceApi.getDevicesByFieldIds(fieldIds).pipe(
              catchError(() => of([])),
              map((deviceResources) =>
                deviceResources
                  .filter(resource => allowedFieldIds.has(Number(resource.field_id)))
                  .map(DeviceAssembler.toEntityFromResource)
              ),
              tap((userDevices) => {
                this._devices.set(userDevices);
              }),
              switchMap((userDevices) => {
                if (userDevices.length === 0) {
                  this.reports.set([]);
                  this.readings.set([]);
                  this.loading.set(false);
                  return of(void 0);
                }

                const deviceIds = userDevices.map(d => Number(d.id));

                return forkJoin({
                  reports: this.analyticsContext.getReportsByDeviceIds(deviceIds).pipe(
                    catchError(() => of([]))
                  ),
                  readings: this.sensorReadingsApi.getReadingsByDeviceIds(deviceIds).pipe(
                    catchError(() => of([]))
                  ),
                }).pipe(
                  map(({ reports, readings }) => {
                    const allowedDeviceIds = new Set(deviceIds);
                    return {
                      reports: reports.filter(report => allowedDeviceIds.has(Number(report.deviceId))),
                      readings: readings
                        .filter(reading => allowedDeviceIds.has(Number(reading.device_id)))
                        .map(SensorReadingAssembler.toEntityFromResource),
                    };
                  }),
                  tap(({ reports, readings }) => {
                    this.reports.set(reports);
                    this.readings.set(readings);
                    this.loading.set(false);
                    this.persistThresholdAlerts();
                  }),
                  map(() => void 0)
                );
              })
            );
          })
        );
      }),
      catchError((error) => {
        this.loading.set(false);
        return throwError(() => error);
      })
    );
  }

  setSelectedField(fieldId: number | null): void {
    this.selectedFieldId.set(fieldId);
  }

  createDevice(request: CreateDeviceRequest): Observable<Device> {
    return this.deviceApi.createDevice(request).pipe(
      map(DeviceAssembler.toEntityFromResource),
      tap((newDevice) => {
        this._devices.update((current) => [...current, newDevice]);
        this.notificationEvents.deviceCreated(newDevice);
      })
    );
  }

  getReadingsForDevice(deviceId: number): SensorReading[] {
    return this.latestReadingsByDevice().get(Number(deviceId)) ?? [];
  }

  /**
   * Persists a notification for each out-of-range report (US16/US17).
   * Alerts are de-duplicated per device, parameter and report timestamp.
   */
  private persistThresholdAlerts(): void {
    const profileId = this.profileContext.currentProfileId();
    if (profileId === null) {
      return;
    }

    const fieldsList = this.fields();

    for (const report of this.latestReports()) {
      const status = this.evaluateReportStatus(report);
      if (status === 'OPTIMAL') continue;

      const alertKey = `${report.deviceId}-${report.parameter}-${report.generatedAt}`;
      if (this.persistedAlertKeys.has(alertKey)) continue;

      const device = this.devices().find(d => Number(d.id) === Number(report.deviceId));
      if (!device) continue;

      const field = fieldsList.find(f => Number(f.id) === Number(device.fieldId));
      const zoneName = field
        ? field.name
        : `${TELEMETRY_ALERT_TYPE_KEYS.FIELD_FALLBACK_PREFIX}${device.fieldId}`;
      const threshold = this.thresholdFor(report);

      const template =
        status === 'LOW_MOISTURE'
          ? TELEMETRY_ALERT_MESSAGES.lowMoisture
          : TELEMETRY_ALERT_MESSAGES.outOfRange;

      this.persistedAlertKeys.add(alertKey);

      this.notificationApi
        .create({
          profileId,
          title: template.title,
          message: template.message(zoneName, device.macAddress, report.meanValue, report.unit, threshold),
          type: NotificationType.SENSOR_ALERT,
          fieldId: device.fieldId,
        })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
  }

  private reportKey(deviceId: number, parameter: TelemetryParameter): string {
    return `${Number(deviceId)}-${parameter}`;
  }
}
