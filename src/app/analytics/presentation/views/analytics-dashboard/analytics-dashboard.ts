import {Component, inject, OnInit} from '@angular/core';
import {AnalyticsStore} from '../../../application/analytics.store';

@Component({
  imports: [],
  selector: 'app-analytics-dashboard',
  styleUrl: './analytics-dashboard.css',
  templateUrl: './analytics-dashboard.html',
})
export class AnalyticsDashboardComponent implements OnInit {
  private readonly analyticsStore = inject(AnalyticsStore);

  readonly devices = this.analyticsStore.userDevices;
  readonly selectedDeviceId = this.analyticsStore.selectedDeviceId;
  readonly indicators = this.analyticsStore.indicators;
  readonly loading = this.analyticsStore.loading;

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
}
