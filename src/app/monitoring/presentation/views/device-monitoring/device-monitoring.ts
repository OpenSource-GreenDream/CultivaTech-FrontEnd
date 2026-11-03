import {Component, inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MonitoringStore, TelemetryAlertStatus} from '../../../application/monitoring.store';
import {TranslatePipe} from '@ngx-translate/core';
import {DatePipe} from '@angular/common';
import {AnalyticsReport} from '../../../../analytics/domain/model/entity/analytics-report.entity';
import {SensorReading} from '../../../domain/model/sensor-reading.entity';
import {PARAMETER_I18N_KEYS, TelemetryParameter} from '../../../domain/model/telemetry-parameter';

@Component({
  imports: [
    TranslatePipe,
    DatePipe
  ],
  selector: 'app-device-monitoring',
  styleUrl: './device-monitoring.css',
  templateUrl: './device-monitoring.html',
})
export class DeviceMonitoring implements OnInit {
  private readonly monitoringStore = inject(MonitoringStore);
  private readonly router = inject(Router);

  readonly fields = this.monitoringStore.fields;
  readonly filteredDevices = this.monitoringStore.filteredDevices;
  readonly loading = this.monitoringStore.loading;
  readonly selectedFieldId = this.monitoringStore.selectedFieldId;
  readonly moistureThreshold = this.monitoringStore.moistureThreshold;
  readonly tempThreshold = this.monitoringStore.tempThreshold;
  readonly activeAlerts = this.monitoringStore.activeAlerts;

  ngOnInit(): void {
    this.monitoringStore.loadMonitoringData().subscribe({
      error: () => {
        this.monitoringStore.loading.set(false);
      }
    });
  }

  getFieldName(fieldId: number): string {
    const field = this.fields().find((item) => Number(item.id) === Number(fieldId));
    return field ? field.name : `#${fieldId}`;
  }

  getReport(deviceId: number): AnalyticsReport | undefined {
    return this.monitoringStore.latestReportByDevice().get(Number(deviceId));
  }

  getReadings(deviceId: number): SensorReading[] {
    return this.monitoringStore.getReadingsForDevice(deviceId);
  }

  getReportStatus(report: AnalyticsReport | undefined): TelemetryAlertStatus {
    return this.monitoringStore.evaluateReportStatus(report);
  }

  getThreshold(report: AnalyticsReport | undefined): number | null {
    return report ? this.monitoringStore.thresholdFor(report) : null;
  }

  getParameterKey(parameter: TelemetryParameter | undefined): string {
    return parameter ? PARAMETER_I18N_KEYS[parameter] : PARAMETER_I18N_KEYS[TelemetryParameter.MOISTURE];
  }

  onFieldChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.monitoringStore.setSelectedField(value === '' ? null : Number(value));
  }

  goToHistory(): void {
    this.router.navigate(['/monitoring/sensor-history']);
  }

  goToCreateDevice(): void {
    this.router.navigate(['/monitoring/create-device']);
  }

  goToSummary(): void {
    this.router.navigate(['/monitoring']);
  }
}
