import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {ReactiveFormsModule} from '@angular/forms';
import {AnalyticsStore} from '../../../application/analytics.store';
import {TelemetryChartComponent} from '../../components/telemetry-chart/telemetry-chart';
import {DisplayUnitPipe} from '../../../../monitoring/presentation/pipes/display-unit.pipe';
import {AnalyticsReport} from '../../../domain/model/entity/analytics-report.entity';
import {PROJECTION_BAR_MAX_PERCENT, PROJECTION_BAR_MAX_TONS} from '../../../domain/model/analytics.constants';

@Component({
  imports: [
    TranslatePipe,
    ReactiveFormsModule,
    TelemetryChartComponent,
    DisplayUnitPipe
  ],
  selector: 'app-analytics-dashboard',
  styleUrl: './analytics-dashboard.css',
  templateUrl: './analytics-dashboard.html',
})
export class AnalyticsDashboardComponent implements OnInit {
  private readonly analyticsStore = inject(AnalyticsStore);
  readonly devices = this.analyticsStore.userDevices;
  readonly selectedDeviceId = this.analyticsStore.selectedDeviceId;
  readonly indicators = this.analyticsStore.indicators;
  readonly reports = this.analyticsStore.reports;
  readonly trendReadings = this.analyticsStore.trendReadings;
  readonly loading = this.analyticsStore.loading;
  readonly statistics = this.analyticsStore.statistics;
  readonly selectedStatistics = this.analyticsStore.selectedStatistics;
  readonly selectedStatisticsParameter = this.analyticsStore.selectedStatisticsParameter;

  readonly statisticsParameters = this.analyticsStore.statisticsParameters;

  readonly hoveredReading = signal<any | null>(null);
  readonly parameterKey = this.analyticsStore.activeParameterKey;
  readonly activeUnit = this.analyticsStore.activeUnit;
  readonly criticalThreshold = this.analyticsStore.activeThreshold;

  readonly reportFrom = signal<string>('');
  readonly reportTo = signal<string>('');
  readonly reportError = signal<string | null>(null);

  readonly statusKey = computed(() => `analytics.status.${this.indicators().status}`);

  readonly parameterColor = computed(() => {
    const parameter = this.selectedStatistics()?.parameter ?? this.selectedStatisticsParameter() ?? 'MOISTURE';
    const colors: Record<string, string> = {
      MOISTURE: '#3182ce',
      PH: '#805ad5',
      NITROGEN: '#38a169',
      PHOSPHORUS: '#d69e2e',
      POTASSIUM: '#319795',
      CALCIUM: '#2b6cb0',
      MAGNESIUM: '#718096',
      SULFUR: '#805ad5',
    };
    return colors[parameter] ?? '#2b6cb0';
  });

  ngOnInit(): void {
    this.analyticsStore.initAnalyticsData().subscribe();
  }

  onDeviceChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const deviceId = Number(select.value);
    if (deviceId) {
      this.analyticsStore.selectDevice(deviceId);
    }
  }

  onParameterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.analyticsStore.selectStatisticsParameter(select.value || null);
  }

  refreshStatistics(): void {
    const deviceId = this.selectedDeviceId();
    if (!deviceId) return;
    this.analyticsStore.loadStatistics(deviceId, this.reportFrom() || undefined, this.reportTo() || undefined).subscribe({
      error: () => {},
    });
    this.analyticsStore.loadReadings(deviceId).subscribe({ error: () => {} });
  }

  selectStatisticsParameter(parameter: string): void {
    this.analyticsStore.selectStatisticsParameter(parameter);
  }

  generateReport(): void {
    const deviceId = this.selectedDeviceId();
    const from = this.reportFrom();
    const to = this.reportTo();
    if (!deviceId || !from || !to) {
      this.reportError.set('analytics.report.error-required');
      return;
    }
    this.reportError.set(null);
    this.analyticsStore.generateReport(deviceId, from, to).subscribe({
      error: () => this.reportError.set('analytics.report.error-submit'),
    });
  }

  isAlert(report: AnalyticsReport): boolean {
    return this.analyticsStore.isAlert(report);
  }

  barWidth(tons: number): number {
    if (!Number.isFinite(tons) || tons <= 0) return 0;
    return Math.min(PROJECTION_BAR_MAX_PERCENT, (tons / PROJECTION_BAR_MAX_TONS) * PROJECTION_BAR_MAX_PERCENT);
  }

  readonly chartValues = computed(() => {
    const reps = this.trendReadings();
    const threshold = this.criticalThreshold();
    if (reps.length === 0) return { minVal: 0, rangeVal: 1 };
    const values = reps.map(r => r.value);
    const minVal = Math.min(...values, threshold - 2);
    const maxVal = Math.max(...values, threshold + 2);
    const rangeVal = maxVal - minVal || 1;
    return { minVal, rangeVal };
  });

  readonly thresholdY = computed(() => {
    const height = 180;
    const padding = 30;
    const innerHeight = height - padding * 2;
    const { minVal, rangeVal } = this.chartValues();
    const threshold = this.criticalThreshold();

    return height - padding - ((threshold - minVal) / rangeVal) * innerHeight;
  });

  readonly chartPoints = computed(() => {
    const reps = this.trendReadings();
    if (reps.length === 0) return '';

    const width = 600;
    const height = 180;
    const padding = 30;

    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    const { minVal, rangeVal } = this.chartValues();

    return reps.map((rep, index) => {
      const x = padding + (index / (reps.length - 1 || 1)) * innerWidth;
      const y = height - padding - ((rep.value - minVal) / rangeVal) * innerHeight;

      return `${x},${y}`;
    }).join(' ');
  });
}