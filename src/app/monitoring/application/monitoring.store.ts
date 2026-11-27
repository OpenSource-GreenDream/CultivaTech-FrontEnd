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

import {CreateDeviceRequest} from '../domain/model/create-device.request';
import {SensorReading} from '../domain/model/sensor-reading.entity';
import {AnalyticsReport} from '../../analytics/domain/model/entity/analytics-report.entity';
import {SensorReadingAssembler} from '../infrastructure/sensor-reading.assembler';
import {SensorReadingsApi} from '../infrastructure/sensor-readings-api';
import {RegisterSensorReadingRequest} from '../infrastructure/register-sensor-reading.request';
import {
  evaluateTelemetryStatus,
  isTelemetryParameter,
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
  parameter: string;
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
    () => this.profileContext.currentProfile()?.temperatureThreshold ?? null
  );

  readonly canManageAgriculturalMonitoring = computed(
    () => this.authService.hasRole('FARMER') || this.authService.hasRole('ADMIN'),
  );

  readonly isCommercialUser = computed(
    () => this.authService.hasRole('CUSTOMER') || this.authService.hasRole('SUPPLIER'),
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

  readonly filteredReadings = computed(() => {
    const fieldId = this.selectedFieldId();
    const allowedDeviceIds = new Set(this.devices().map((device) => Number(device.id)));
    let list = this.readings().filter((reading) =>
      allowedDeviceIds.has(Number(reading.deviceId)),
    );
    if (fieldId !== null) {
      const fieldDeviceIds = new Set(
        this.devices()
          .filter((device) => Number(device.fieldId) === Number(fieldId))
          .map((device) => Number(device.id)),
      );
      list = list.filter((reading) => fieldDeviceIds.has(Number(reading.deviceId)));
    }
    return [...list].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    );
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

    for (const deviceReadings of this.latestReadingsByDevice().values()) {
      for (const reading of deviceReadings) {
        if (!isTelemetryParameter(reading.parameter)) continue;

        const status = evaluateTelemetryStatus(
          reading.parameter,
          Number(reading.value),
          this.thresholds(),
        );
        if (status === 'OPTIMAL') continue;

        const device = this.devices().find(d => Number(d.id) === Number(reading.deviceId));
        if (!device) continue;

        const field = fieldsList.find(f => Number(f.id) === Number(device.fieldId));

        alerts.push({
          deviceId: device.id,
          macAddress: device.macAddress,
          fieldId: device.fieldId,
          fieldName: field ? field.name : `${TELEMETRY_ALERT_TYPE_KEYS.FIELD_FALLBACK_PREFIX}${device.fieldId}`,
          parameter: reading.parameter,
          unit: reading.unit,
          meanValue: reading.value,
          thresholdValue: this.thresholdForParameter(reading.parameter),
          status,
        });
      }
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
    if (!report || !report.parameter || !isTelemetryParameter(report.parameter)) {
      return 'OPTIMAL';
    }
    return evaluateTelemetryStatus(report.parameter, Number(report.meanValue), this.thresholds());
  }

  /**
   * Resolves the threshold used by the alert evaluation for the report parameter.
   */
  thresholdFor(report: AnalyticsReport): number {
    if (!isTelemetryParameter(report.parameter)) return 0;
    return resolveParameterThreshold(report.parameter, this.thresholds());
  }

  thresholdForParameter(parameter: string): number {
    if (!isTelemetryParameter(parameter)) return 0;
    return resolveParameterThreshold(parameter, this.thresholds());
  }

  evaluateReadingStatus(reading: SensorReading | undefined): TelemetryAlertStatus {
    if (!reading || !isTelemetryParameter(reading.parameter)) {
      return 'OPTIMAL';
    }
    return evaluateTelemetryStatus(reading.parameter, Number(reading.value), this.thresholds());
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

    if (this.authService.hasRole('CUSTOMER') || this.authService.hasRole('SUPPLIER')) {
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
              .filter(field => Number(field.profileId) === Number(profile.id))
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
              map((deviceResources) =>
                deviceResources
                  .filter(resource => allowedFieldIds.has(Number(resource.fieldId)))
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

                return this.sensorReadingsApi.getReadingsByDeviceIds(deviceIds).pipe(
                  map((readings) => {
                    const allowedDeviceIds = new Set(deviceIds);
                    return readings
                      .filter(reading => allowedDeviceIds.has(Number(reading.deviceId)))
                      .map(SensorReadingAssembler.toEntityFromResource);
                  }),
                  tap((readings) => {
                    this.reports.set([]);
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

  updateDevice(deviceId: number, status: string): Observable<Device> {
    return this.deviceApi.updateDevice(deviceId, { status }).pipe(
      map(DeviceAssembler.toEntityFromResource),
      tap((updatedDevice) => {
        this._devices.update((current) =>
          current.map((device) =>
            Number(device.id) === Number(deviceId) ? updatedDevice : device,
          ),
        );
      }),
    );
  }

  deleteDevice(deviceId: number): Observable<void> {
    return this.deviceApi.deleteDevice(deviceId).pipe(
      tap(() => {
        this._devices.update((current) =>
          current.filter((device) => Number(device.id) !== Number(deviceId)),
        );
        this.readings.update((current) =>
          current.filter((reading) => Number(reading.deviceId) !== Number(deviceId)),
        );
      }),
    );
  }

  createReading(
    deviceId: number,
    request: RegisterSensorReadingRequest,
  ): Observable<SensorReading> {
    return this.sensorReadingsApi.createReading(deviceId, request).pipe(
      map(SensorReadingAssembler.toEntityFromResource),
      tap((newReading) => {
        this.readings.update((current) => [...current, newReading]);
        this.persistThresholdAlerts();
      }),
    );
  }

  deleteReading(sensorReadingId: number): Observable<void> {
    return this.sensorReadingsApi.deleteReading(sensorReadingId).pipe(
      tap(() => {
        this.readings.update((current) =>
          current.filter((reading) => Number(reading.id) !== Number(sensorReadingId)),
        );
      }),
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
    const thresholds = this.thresholds();

    for (const deviceReadings of this.latestReadingsByDevice().values()) {
      for (const reading of deviceReadings) {
        if (!isTelemetryParameter(reading.parameter)) continue;

        const status = evaluateTelemetryStatus(reading.parameter, Number(reading.value), thresholds);
        if (status === 'OPTIMAL') continue;

        const alertKey = `${reading.deviceId}-${reading.parameter}-${reading.recordedAt}`;
        if (this.persistedAlertKeys.has(alertKey)) continue;

        const device = this.devices().find(d => Number(d.id) === Number(reading.deviceId));
        if (!device) continue;

        const field = fieldsList.find(f => Number(f.id) === Number(device.fieldId));
        const zoneName = field
          ? field.name
          : `${TELEMETRY_ALERT_TYPE_KEYS.FIELD_FALLBACK_PREFIX}${device.fieldId}`;
        const threshold = this.thresholdForParameter(reading.parameter);

        const template =
          status === 'LOW_MOISTURE'
            ? TELEMETRY_ALERT_MESSAGES.lowMoisture
            : TELEMETRY_ALERT_MESSAGES.outOfRange;

        this.persistedAlertKeys.add(alertKey);

        this.notificationApi
          .create({
            profileId,
            title: template.title,
            message: template.message(zoneName, device.macAddress, reading.value, reading.unit, threshold),
            type: NotificationType.SENSOR_ALERT,
            fieldId: device.fieldId,
          })
          .pipe(catchError(() => of(null)))
          .subscribe();
      }
    }
  }

  private reportKey(deviceId: number, parameter: string): string {
    return `${Number(deviceId)}-${parameter}`;
  }
}
