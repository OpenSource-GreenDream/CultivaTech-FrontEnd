import {Component, computed, inject, OnInit} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {DatePipe} from '@angular/common';
import {AnalyticsStore} from '../../../application/analytics.store';

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
  readonly projections = this.analyticsStore.projections;
  readonly loading = this.analyticsStore.loading;

  readonly criticalThreshold = 25.5;

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

  readonly chartValues = computed(() => {
    const reps = this.reports();
    if (reps.length === 0) return { minVal: 0, rangeVal: 1 };
    const values = reps.map(r => r.meanValue);
    const minVal = Math.min(...values, this.criticalThreshold - 2);
    const maxVal = Math.max(...values, this.criticalThreshold + 2);
    const rangeVal = maxVal - minVal || 1;
    return { minVal, rangeVal };
  });

  readonly thresholdY = computed(() => {
    const height = 180;
    const padding = 30;
    const innerHeight = height - padding * 2;
    const { minVal, rangeVal } = this.chartValues();

    return height - padding - ((this.criticalThreshold - minVal) / rangeVal) * innerHeight;
  });

  readonly chartPoints = computed(() => {
    const reps = this.reports();
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
