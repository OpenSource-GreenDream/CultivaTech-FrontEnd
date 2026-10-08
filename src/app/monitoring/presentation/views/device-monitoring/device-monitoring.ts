import {Component, inject} from '@angular/core';
import {Router} from '@angular/router';
import {MonitoringStore} from '../../../application/monitoring.store';
import {TranslatePipe} from '@ngx-translate/core';
import {DatePipe} from '@angular/common';
import {AnalyticsReport} from '../../../../analytics/domain/model/entity/analytics-report';

@Component({
  imports: [
    TranslatePipe,
    DatePipe
  ],
  selector: 'app-device-monitoring',
  styleUrl: './device-monitoring.css',
  templateUrl: './device-monitoring.html',
})
export class DeviceMonitoring {
  private readonly monitoringStore = inject(MonitoringStore);
  private readonly router = inject(Router);

  readonly fields = this.monitoringStore.fields;
  readonly filteredDevices = this.monitoringStore.filteredDevices;
  readonly loading = this.monitoringStore.loading;

  ngOnInit(): void {
    this.monitoringStore.loadMonitoringData().subscribe();
  }

  getFieldName(fieldId: number): string {
    const field = this.fields().find((item) => Number(item.id) === Number(fieldId));
    return field ? field.name : `Campo ${fieldId}`;
  }

  getReport(deviceId: number): AnalyticsReport | undefined {
    return this.monitoringStore.reports().find((report) => Number(report.deviceId) === Number(deviceId));
  }

  onFieldChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.monitoringStore.setSelectedField(value === '' ? null : Number(value));
  }

  goToHistory(): void {
    this.router.navigate(['/monitoring/sensor-history']);
  }
}
