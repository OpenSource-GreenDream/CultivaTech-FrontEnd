import {Component, inject, OnInit} from '@angular/core';
import {MonitoringStore, TelemetryAlertStatus} from '../../../application/monitoring.store';
import {Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {DatePipe} from '@angular/common';
import {AnalyticsReport} from '../../../../analytics/domain/model/entity/analytics-report.entity';
import {PARAMETER_I18N_KEYS, TelemetryParameter} from '../../../domain/model/telemetry-parameter';

@Component({
  imports: [
    TranslatePipe,
    DatePipe
  ],
  selector: 'app-sensor-history',
  styleUrl: './sensor-history.css',
  templateUrl: './sensor-history.html',
})
export class SensorHistory implements OnInit {
  private readonly monitoringStore = inject(MonitoringStore);
  private readonly router = inject(Router);

  readonly fields = this.monitoringStore.fields;
  readonly devices = this.monitoringStore.devices;
  readonly selectedFieldId = this.monitoringStore.selectedFieldId;
  readonly reports = this.monitoringStore.filteredReports;
  readonly loading = this.monitoringStore.loading;
  readonly moistureThreshold = this.monitoringStore.moistureThreshold;
  readonly tempThreshold = this.monitoringStore.tempThreshold;

  ngOnInit(): void {
    this.monitoringStore.loadMonitoringData().subscribe({
      error: () => {
        this.monitoringStore.loading.set(false);
      }
    });
  }

  onFieldChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.monitoringStore.setSelectedField(value === '' ? null : Number(value));
  }

  getDeviceZoneName(deviceId: number): string {
    const device = this.devices().find(d => Number(d.id) === Number(deviceId));
    if (!device) return `#${deviceId}`;
    const field = this.fields().find(f => Number(f.id) === Number(device.fieldId));
    return field ? field.name : `#${device.fieldId}`;
  }

  getReportStatus(report: AnalyticsReport): TelemetryAlertStatus {
    return this.monitoringStore.evaluateReportStatus(report);
  }

  getThreshold(report: AnalyticsReport): number {
    return this.monitoringStore.thresholdFor(report);
  }

  getParameterKey(parameter: TelemetryParameter): string {
    return PARAMETER_I18N_KEYS[parameter];
  }

  goBack(): void {
    this.router.navigate(['/monitoring']);
  }
}
