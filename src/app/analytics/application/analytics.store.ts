import {computed, DestroyRef, inject, Service, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {catchError, finalize, forkJoin, map, Observable, of, Subject, switchMap, tap, throwError} from 'rxjs';
import {KeyIndicators} from '../domain/model/valueobjects/key-indicators';
import {DeviceAssembler} from '../../monitoring/infrastructure/device.assembler';
import {DeviceApi} from '../../monitoring/infrastructure/device-api';
import {AuthService} from '../../iam/application/auth.service';
import {ProfileContextService} from '../../profile/application/profile-context.service';
import {FieldApi} from '../../profile/infrastructure/field-api';
import {FieldAssembler} from '../../profile/infrastructure/field.assembler';
import {Field} from '../../profile/domain/model/field.entity';
import {Device} from '../../monitoring/domain/model/device.entity';
import {AnalyticsContext} from './analytics-context.store';
import {StockStore} from '../../stock/application/stock.store';
import {Product} from '../../stock/domain/model/product.entity';

import {AnalyticsReportAssembler} from '../infrastructure/analytics-report.assembler';
import {AnalyticsApi} from '../infrastructure/analytics-api';
import {AnalyticsReport} from '../domain/model/entity/analytics-report.entity';

import {SensorStatistics} from '../domain/model/entity/sensor-statistics.entity';
import {ReportRequest} from '../infrastructure/report.request';
import {SensorStatisticsAssembler} from '../infrastructure/sensor-statistics.assembler';
import {SensorReadingsApi} from '../../monitoring/infrastructure/sensor-readings-api';
import {SensorReading} from '../../monitoring/domain/model/sensor-reading.entity';
import {SensorReadingAssembler} from '../../monitoring/infrastructure/sensor-reading.assembler';
import {
  evaluateTelemetryStatus,
  isTelemetryParameter,
  PARAMETER_I18N_KEYS,
  PARAMETER_RANGES,
  resolveParameterThreshold,
  TelemetryParameter,
} from '../../monitoring/domain/model/telemetry-parameter';
import {
  ANALYTICS_VARIANCE_ALERT_THRESHOLD,
  AnalyticsStatus,
} from '../domain/model/analytics.constants';

@Service()
export class AnalyticsStore {
  private readonly analyticsContext = inject(AnalyticsContext);
  private readonly analyticsApi = inject(AnalyticsApi);
  private readonly sensorReadingsApi = inject(SensorReadingsApi);
  private readonly deviceApi = inject(DeviceApi);
  private readonly fieldApi = inject(FieldApi);
  private readonly stockStore = inject(StockStore);
  private readonly authService = inject(AuthService);
  private readonly profileContext = inject(ProfileContextService);
  private readonly destroyRef = inject(DestroyRef);

  /** Emits device selections so pending telemetry requests can be cancelled. */
  private readonly deviceSelection$ = new Subject<number>();

  private readonly _fields = signal<Field[]>([]);
  private readonly _devices = signal<Device[]>([]);
  private readonly _reports = signal<AnalyticsReport[]>([]);
  private readonly _statistics = signal<SensorStatistics[]>([]);
  private readonly _readings = signal<SensorReading[]>([]);
  readonly fields = this._fields.asReadonly();
  readonly statistics = this._statistics.asReadonly();
  readonly readings = this._readings.asReadonly();
  readonly selectedDeviceId = signal<number | null>(null);
  readonly selectedStatisticsParameter = signal<string | null>(null);
  readonly loading = signal<boolean>(false);

  /**
   * Products of the active farm, including their `fieldId`, exposed to
   * analytics projections and metrics.
   */
  readonly products = this.stockStore.products;
  readonly productFieldIds = this.stockStore.productFieldIds;

  /** Products that belong to the fields (batches) used by the current metrics. */
  readonly activeFieldProducts = computed<Product[]>(() => {
    const fieldIds = new Set(this._fields().map(field => Number(field.id)));
    return this.products().filter(
      product => product.fieldId === null || product.fieldId === undefined || fieldIds.has(Number(product.fieldId))
    );
  });

  readonly moistureThreshold = computed<number | null>(
    () => this.profileContext.currentProfile()?.moistureThreshold ?? null
  );

  readonly tempThreshold = computed<number | null>(
    () => this.profileContext.currentProfile()?.temperatureThreshold ?? null
  );

  private readonly thresholds = computed(() => ({
    moisture: this.moistureThreshold(),
    temperature: this.tempThreshold(),
  }));

  readonly userDevices = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    const allowedFieldIds = new Set(this._fields().map(f => Number(f.id)));
    return this._devices().filter(device => allowedFieldIds.has(Number(device.fieldId)));
  });

  /** Reports of the selected device, newest first. */
  readonly selectedReports = computed(() => {
    const selectedDeviceId = this.selectedDeviceId();
    const allowedDeviceIds = new Set(this.userDevices().map(d => Number(d.id)));

    return [...this._reports()]
      .filter(report => allowedDeviceIds.has(Number(report.deviceId)))
      .filter(report => selectedDeviceId === null || Number(report.deviceId) === Number(selectedDeviceId))
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  });

  /** Newest report, which defines the active parameter of the dashboard. */
  readonly latestReport = computed<AnalyticsReport | null>(() => this.selectedReports()[0] ?? null);

  /** Parameter currently visualised (the one of the newest report). */
  readonly activeParameter = computed<string>(
    () => this.selectedStatistics()?.parameter ?? 'MOISTURE'
  );

  readonly activeParameterKey = computed(() => {
    const parameter = this.activeParameter();
    return isTelemetryParameter(parameter)
      ? PARAMETER_I18N_KEYS[parameter]
      : parameter;
  });

  readonly activeUnit = computed(
    () => this.selectedStatistics()?.unit
      ?? (isTelemetryParameter(this.activeParameter())
        ? PARAMETER_RANGES[this.activeParameter() as TelemetryParameter].unit
        : '')
  );

  /** Threshold that applies to the active parameter only. */
  readonly activeThreshold = computed(() => {
    const parameter = this.activeParameter();
    if (!isTelemetryParameter(parameter)) return 0;
    return resolveParameterThreshold(parameter, this.thresholds());
  });

  /** Reports of the active parameter, newest first (used by the table). */
  readonly reports = computed(() =>
    this.selectedReports().filter(report => report.parameter === this.activeParameter())
  );

  /** Reports of the active parameter in chronological order (used by the table). */
  readonly chartReports = computed(() =>
    [...this.reports()].sort((a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime())
  );

  /** Real sensor readings for the selected device/parameter in chronological order. */
  readonly trendReadings = computed(() => {
    const parameter = this.selectedStatistics()?.parameter;
    const unit = this.selectedStatistics()?.unit;
    const list = this._readings().filter((reading) => {
      if (parameter && reading.parameter !== parameter) return false;
      if (unit && reading.unit !== unit) return false;
      return true;
    });
    return [...list].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  });

  readonly statisticsParameters = computed<string[]>(() => {
    const params = new Set(this._statistics().map((s) => s.parameter));
    return Array.from(params);
  });

  readonly selectedStatistics = computed<SensorStatistics | null>(() => {
    const stats = this._statistics();
    if (stats.length === 0) return null;
    const selected = this.selectedStatisticsParameter();
    if (selected) {
      const match = stats.find((s) => s.parameter === selected);
      if (match) return match;
    }
    const moisture = stats.find((s) => s.parameter === 'MOISTURE');
    return moisture ?? stats[0];
  });

  readonly indicators = computed<KeyIndicators>(() => {
    const stat = this.selectedStatistics();
    const totalReports = this.reports().length;

    if (!stat || stat.sampleCount === 0) {
      return {
        averageMean: 0,
        averageVariance: 0,
        averageDeviation: 0,
        totalReports,
        status: 'NO_DATA',
      };
    }

    const telemetryStatus = isTelemetryParameter(stat.parameter)
      ? evaluateTelemetryStatus(stat.parameter, stat.meanValue, this.thresholds())
      : 'OPTIMAL';

    const status: AnalyticsStatus =
      telemetryStatus !== 'OPTIMAL' || stat.variance > ANALYTICS_VARIANCE_ALERT_THRESHOLD
        ? 'ALERT'
        : 'OPTIMAL';

    return {
      averageMean: +stat.meanValue.toFixed(2),
      averageVariance: +stat.variance.toFixed(2),
      averageDeviation: +stat.standardDeviation.toFixed(2),
      totalReports,
      status,
    };
  });

  constructor() {
    this.authService.registerCleanup(() => this.clearState());

    this.deviceSelection$
      .pipe(
        switchMap(deviceId =>
          this.fetchDeviceTelemetry(deviceId).pipe(
            catchError(() => of(void 0))
          )
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  clearState(): void {
    this._fields.set([]);
    this._devices.set([]);
    this._reports.set([]);
    this._statistics.set([]);
    this._readings.set([]);
    this.selectedDeviceId.set(null);
    this.selectedStatisticsParameter.set(null);
    this.loading.set(false);
  }

  initAnalyticsData(): Observable<void> {
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

        return forkJoin({
          fieldsRaw: this.fieldApi.getFields(profile.id),
          productsLoaded: this.stockStore.loadProducts().pipe(catchError(() => of([])))
        }).pipe(
          map(({ fieldsRaw }) =>
            fieldsRaw
              .filter(field => Number(field.profileId) === Number(profile.id))
              .map(FieldAssembler.toEntityFromResource)
          ),
          tap((userFields) => {
            this._fields.set(userFields);
          }),
          switchMap((userFields) => {
            if (userFields.length === 0) {
              this._devices.set([]);
              this._reports.set([]);
              this.selectedDeviceId.set(null);
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
                  this._reports.set([]);
                  this.selectedDeviceId.set(null);
                  this.loading.set(false);
                  return of(void 0);
                }

                const firstDeviceId = Number(userDevices[0].id);
                this.selectedDeviceId.set(firstDeviceId);
                return this.fetchDeviceTelemetry(firstDeviceId);
              })
            );
          })
        );
      }),
      catchError((err) => {
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  selectDevice(deviceId: number): void {
    const isOwnedByUser = this.userDevices().some(d => Number(d.id) === Number(deviceId));
    if (!isOwnedByUser || this.selectedDeviceId() === deviceId) return;

    this.selectedDeviceId.set(deviceId);
    this.loading.set(true);
    this.deviceSelection$.next(deviceId);
  }

  selectStatisticsParameter(parameter: string | null): void {
    this.selectedStatisticsParameter.set(parameter);
  }

  loadStatistics(deviceId: number, from?: string, to?: string): Observable<void> {
    return this.analyticsApi.getStatistics(deviceId, from, to).pipe(
      tap((resources) => {
        this._statistics.set(resources.map(SensorStatisticsAssembler.toEntityFromResource));
        const stats = this._statistics();
        const current = this.selectedStatisticsParameter();
        if (!current || !stats.some((s) => s.parameter === current)) {
          const moisture = stats.find((s) => s.parameter === 'MOISTURE');
          this.selectedStatisticsParameter.set(moisture ? moisture.parameter : (stats[0]?.parameter ?? null));
        }
      }),
      map(() => void 0),
    );
  }

  loadReadings(deviceId: number): Observable<void> {
    return this.sensorReadingsApi.getReadingsByDeviceId(deviceId).pipe(
      tap((resources) => {
        this._readings.set(resources.map(SensorReadingAssembler.toEntityFromResource));
      }),
      map(() => void 0),
    );
  }

  generateReport(deviceId: number, from: string, to: string): Observable<void> {
    this.loading.set(true);
    return this.analyticsApi.generateReport(deviceId, { from, to }).pipe(
      tap((generated) => {
        const list = Array.isArray(generated) ? generated : [generated];
        const existing = new Set(this._reports().map((r) => r.id));
        const merged = [...this._reports()];
        for (const report of list.map((r) => AnalyticsReportAssembler.toEntityFromResource(r))) {
          if (!existing.has(report.id)) {
            merged.push(report);
            existing.add(report.id);
          }
        }
        this._reports.set(merged);
      }),
      finalize(() => this.loading.set(false)),
      map(() => void 0),
    );
  }

  /**
   * Evaluates a report against the threshold of its own parameter.
   */
  isAlert(report: AnalyticsReport): boolean {
    if (!isTelemetryParameter(report.parameter)) return false;
    return evaluateTelemetryStatus(report.parameter, report.meanValue, this.thresholds()) !== 'OPTIMAL';
  }

  private fetchDeviceTelemetry(deviceId: number): Observable<void> {
    return forkJoin({
      reports: this.analyticsContext.getReportByDeviceId(deviceId),
      statistics: this.analyticsApi.getStatistics(deviceId),
      readings: this.sensorReadingsApi.getReadingsByDeviceId(deviceId),
    }).pipe(
      tap(({ reports, statistics, readings }) => {
        this._reports.set(reports.filter(r => Number(r.deviceId) === Number(deviceId)));
        this._statistics.set(statistics.map(SensorStatisticsAssembler.toEntityFromResource));
        this._readings.set(readings.map(SensorReadingAssembler.toEntityFromResource));
        const stats = this._statistics();
        const moisture = stats.find((s) => s.parameter === 'MOISTURE');
        this.selectedStatisticsParameter.set(moisture ? moisture.parameter : (stats[0]?.parameter ?? null));
      }),
      finalize(() => this.loading.set(false)),
      map(() => void 0)
    );
  }
}
