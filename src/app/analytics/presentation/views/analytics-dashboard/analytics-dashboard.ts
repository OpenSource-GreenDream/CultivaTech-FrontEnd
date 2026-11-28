import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {AnalyticsStore} from '../../../application/analytics.store';
import {TelemetryChartComponent} from '../../components/telemetry-chart/telemetry-chart';
import {NutrientBarChartComponent} from '../../components/nutrient-bar-chart/nutrient-bar-chart';
import {DisplayUnitPipe} from '../../../../monitoring/presentation/pipes/display-unit.pipe';

@Component({
  imports: [
    TranslatePipe,
    TelemetryChartComponent,
    NutrientBarChartComponent,
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
  readonly trendReadings = this.analyticsStore.trendReadings;
  readonly loading = this.analyticsStore.loading;
  readonly statistics = this.analyticsStore.statistics;
  readonly selectedStatistics = this.analyticsStore.selectedStatistics;
  readonly selectedStatisticsParameter = this.analyticsStore.selectedStatisticsParameter;
  readonly statisticsParameters = this.analyticsStore.statisticsParameters;

  readonly hoveredReading = signal<any | null>(null);
  readonly parameterKey = this.analyticsStore.activeParameterKey;
  readonly activeUnit = this.analyticsStore.activeUnit;
  readonly isNutrientsMode = this.analyticsStore.isNutrientsMode;
  readonly nutrientAverages = this.analyticsStore.nutrientAverages;
  readonly criticalThreshold = this.analyticsStore.activeThreshold;

  readonly reportFrom = signal<string>('');
  readonly reportTo = signal<string>('');
  readonly reportError = signal<string | null>(null);

  readonly statusKey = computed(() => `analytics.threshold-status.${this.indicators().thresholdStatus}`);

  readonly parameterColor = computed(() => {
    const parameter = this.selectedStatistics()?.parameter ?? this.selectedStatisticsParameter() ?? 'MOISTURE';
    const colors: Record<string, string> = {
      MOISTURE: '#66794A',
      PH: '#869660',
      NITROGEN: '#52653B',
      PHOSPHORUS: '#B0BE96',
      POTASSIUM: '#66794A',
      CALCIUM: '#35432C',
      MAGNESIUM: '#869660',
      SULFUR: '#52653B',
    };
    return colors[parameter] ?? '#66794A';
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
}