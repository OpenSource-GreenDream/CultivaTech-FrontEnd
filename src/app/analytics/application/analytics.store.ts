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
import {HarvestProjectionAssembler} from '../infrastructure/harvest-projection.assembler';
import {AnalyticsApi} from '../infrastructure/analytics-api';
import {AnalyticsReport} from '../domain/model/entity/analytics-report.entity';
import {HarvestProjection} from '../domain/model/entity/harvest-projection.entity';
import {
  evaluateTelemetryStatus,
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
  readonly projections = signal<HarvestProjection[]>([]);
  readonly selectedDeviceId = signal<number | null>(null);
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
    () => this.profileContext.currentProfile()?.tempThreshold ?? null
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
  readonly activeParameter = computed<TelemetryParameter>(
    () => this.latestReport()?.parameter ?? TelemetryParameter.MOISTURE
  );

  readonly activeParameterKey = computed(() => PARAMETER_I18N_KEYS[this.activeParameter()]);

  readonly activeUnit = computed(
    () => this.selectedReports().find(r => r.parameter === this.activeParameter())?.unit
      ?? PARAMETER_RANGES[this.activeParameter()].unit
  );

  /** Threshold that applies to the active parameter only. */
  readonly activeThreshold = computed(() =>
    resolveParameterThreshold(this.activeParameter(), this.thresholds())
  );

  /** Reports of the active parameter, newest first (used by the table). */
  readonly reports = computed(() =>
    this.selectedReports().filter(report => report.parameter === this.activeParameter())
  );

  /** Reports of the active parameter in chronological order (used by the chart). */
  readonly chartReports = computed(() =>
    [...this.reports()].sort((a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime())
  );

  readonly indicators = computed<KeyIndicators>(() => {
    const reportsList = this.reports();
    const total = reportsList.length;

    if (total === 0) {
      return {
        averageMean: 0,
        averageVariance: 0,
        averageDeviation: 0,
        totalReports: 0,
        status: 'NO_DATA',
      };
    }

    const sumMean = reportsList.reduce((acc, r) => acc + r.meanValue, 0);
    const sumVariance = reportsList.reduce((acc, r) => acc + r.variance, 0);
    const sumDev = reportsList.reduce((acc, r) => acc + r.standardDeviation, 0);

    const avgVariance = +(sumVariance / total).toFixed(2);
    const latest = this.latestReport();
    const telemetryStatus = latest
      ? evaluateTelemetryStatus(latest.parameter, latest.meanValue, this.thresholds())
      : 'OPTIMAL';

    const status: AnalyticsStatus =
      telemetryStatus !== 'OPTIMAL' || avgVariance > ANALYTICS_VARIANCE_ALERT_THRESHOLD
        ? 'ALERT'
        : 'OPTIMAL';

    return {
      averageMean: +(sumMean / total).toFixed(2),
      averageVariance: avgVariance,
      averageDeviation: +(sumDev / total).toFixed(2),
      totalReports: total,
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
    this.projections.set([]);
    this.selectedDeviceId.set(null);
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
              .filter(field => Number(field.profile_id) === Number(profile.id))
              .map(FieldAssembler.toEntityFromResource)
          ),
          tap((userFields) => {
            this._fields.set(userFields);
          }),
          switchMap((userFields) => {
            if (userFields.length === 0) {
              this._devices.set([]);
              this._reports.set([]);
              this.projections.set([]);
              this.selectedDeviceId.set(null);
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
                  this._reports.set([]);
                  this.projections.set([]);
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

  /**
   * Evaluates a report against the threshold of its own parameter.
   */
  isAlert(report: AnalyticsReport): boolean {
    return evaluateTelemetryStatus(report.parameter, report.meanValue, this.thresholds()) !== 'OPTIMAL';
  }

  private fetchDeviceTelemetry(deviceId: number): Observable<void> {
    return forkJoin({
      reports: this.analyticsContext.getReportByDeviceId(deviceId).pipe(catchError(() => of([]))),
      projectionsRaw: this.analyticsApi.getProjectionsByDeviceId(deviceId).pipe(catchError(() => of([])))
    }).pipe(
      tap(({reports, projectionsRaw}) => {
        this._reports.set(reports.filter(r => Number(r.deviceId) === Number(deviceId)));
        this.projections.set(
          projectionsRaw
            .filter(p => Number(p.device_id) === Number(deviceId))
            .map(HarvestProjectionAssembler.toEntityFromResource)
        );
      }),
      finalize(() => this.loading.set(false)),
      map(() => void 0)
    );
  }
}
