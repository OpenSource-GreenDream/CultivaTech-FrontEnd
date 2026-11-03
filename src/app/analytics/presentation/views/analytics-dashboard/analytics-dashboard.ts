import {Component, computed, inject, OnInit} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {DatePipe} from '@angular/common';
import {AnalyticsStore} from '../../../application/analytics.store';
import {AnalyticsReport} from '../../../domain/model/entity/analytics-report.entity';
import {PROJECTION_BAR_MAX_PERCENT, PROJECTION_BAR_MAX_TONS} from '../../../domain/model/analytics.constants';

@Component({
  imports: [
    TranslatePipe,
    DatePipe
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
  readonly chartReports = this.analyticsStore.chartReports;
  readonly projections = this.analyticsStore.projections;
  readonly loading = this.analyticsStore.loading;
  readonly parameterKey = this.analyticsStore.activeParameterKey;
  readonly activeUnit = this.analyticsStore.activeUnit;
  readonly criticalThreshold = this.analyticsStore.activeThreshold;

  readonly statusKey = computed(() => `analytics.status.${this.indicators().status}`);

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

  isAlert(report: AnalyticsReport): boolean {
    return this.analyticsStore.isAlert(report);
  }

  /**
   * Converts a yield in tons into the width percentage of the comparison bar.
   */
  barWidth(tons: number): number {
    if (!Number.isFinite(tons) || tons <= 0) return 0;
    return Math.min(PROJECTION_BAR_MAX_PERCENT, (tons / PROJECTION_BAR_MAX_TONS) * PROJECTION_BAR_MAX_PERCENT);
  }

  readonly chartValues = computed(() => {
    const reps = this.chartReports();
    const threshold = this.criticalThreshold();
    if (reps.length === 0) return { minVal: 0, rangeVal: 1 };
    const values = reps.map(r => r.meanValue);
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
    const reps = this.chartReports();
    if (reps.length === 0) return '';

    const width = 600;
    const height = 180;
    const padding = 30;

    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    const { minVal, rangeVal } = this.chartValues();

    return reps.map((rep, index) => {
      const x = padding + (index / (reps.length - 1 || 1)) * innerWidth;
      const y = height - padding - ((rep.meanValue - minVal) / rangeVal) * innerHeight;

      return `${x},${y}`;
    }).join(' ');
  });
}
