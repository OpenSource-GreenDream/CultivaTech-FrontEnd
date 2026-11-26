import {Component, inject, OnInit, signal} from '@angular/core';
import {MonitoringStore, TelemetryAlertStatus} from '../../../application/monitoring.store';
import {Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {DatePipe} from '@angular/common';
import {SensorReading} from '../../../domain/model/sensor-reading.entity';
import {PARAMETER_I18N_KEYS, TelemetryParameter, isTelemetryParameter} from '../../../domain/model/telemetry-parameter';
import {RegisterSensorReadingRequest} from '../../../infrastructure/register-sensor-reading.request';

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
  readonly readings = this.monitoringStore.filteredReadings;
  readonly loading = this.monitoringStore.loading;
  readonly moistureThreshold = this.monitoringStore.moistureThreshold;
  readonly tempThreshold = this.monitoringStore.tempThreshold;
  readonly canManage = this.monitoringStore.canManageAgriculturalMonitoring;

  readonly showReadingForm = signal(false);
  readonly readingDeviceId = signal<number | null>(null);
  readonly readingParameter = signal<string>(TelemetryParameter.MOISTURE);
  readonly readingValue = signal<number | null>(null);
  readonly readingUnit = signal<string>('');
  readonly readingRecordedAt = signal<string>('');
  readonly readingError = signal<string | null>(null);
  readonly readingSuccess = signal<string | null>(null);

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

  getParameterKey(parameter: string): string {
    return isTelemetryParameter(parameter) ? PARAMETER_I18N_KEYS[parameter] : parameter;
  }

  getReadingStatus(reading: SensorReading): TelemetryAlertStatus {
    return this.monitoringStore.evaluateReadingStatus(reading);
  }

  getThreshold(reading: SensorReading): number {
    return this.monitoringStore.thresholdForParameter(reading.parameter);
  }

  onUnitChange(): void {
    const parameter = this.readingParameter();
    if (isTelemetryParameter(parameter)) {
      const unit = this.getUnitFor(parameter);
      if (unit) this.readingUnit.set(unit);
    }
  }

  private getUnitFor(parameter: TelemetryParameter): string {
    // reuse existing ranges via import
    const ranges: Record<string, string> = {
      MOISTURE: '%',
      TEMPERATURE: '°C',
      NUTRIENTS: 'ppm',
      PH: 'pH',
    };
    return ranges[parameter] ?? '';
  }

  openReadingForm(deviceId: number): void {
    this.readingDeviceId.set(deviceId);
    this.readingParameter.set(TelemetryParameter.MOISTURE);
    this.readingValue.set(null);
    this.readingUnit.set('%');
    this.readingRecordedAt.set(new Date().toISOString().slice(0, 16));
    this.readingError.set(null);
    this.readingSuccess.set(null);
    this.showReadingForm.set(true);
  }

  closeReadingForm(): void {
    this.showReadingForm.set(false);
  }

  submitReading(): void {
    this.readingError.set(null);
    this.readingSuccess.set(null);

    const deviceId = this.readingDeviceId();
    const value = this.readingValue();
    const unit = this.readingUnit().trim();
    const recordedAt = this.readingRecordedAt().trim();

    if (deviceId === null || value === null || !unit || !recordedAt) {
      this.readingError.set('monitoring.reading.error-required');
      return;
    }

    const request: RegisterSensorReadingRequest = {
      parameter: this.readingParameter(),
      value: Number(value),
      unit,
      recordedAt: new Date(recordedAt).toISOString(),
    };

    this.monitoringStore.createReading(deviceId, request).subscribe({
      next: () => {
        this.readingSuccess.set('monitoring.reading.success');
        this.showReadingForm.set(false);
      },
      error: () => {
        this.readingError.set('monitoring.reading.error-submit');
      },
    });
  }

  deleteReading(reading: SensorReading): void {
    if (!confirm('Delete reading?')) return; // placeholder; UI uses i18n? minimal
    this.monitoringStore.deleteReading(reading.id).subscribe({
      error: () => {
        this.readingError.set('monitoring.reading.error-delete');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/monitoring']);
  }
}