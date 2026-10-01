import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Report } from '../../../domain/model/report.entity';
import { Sensor } from '../../../domain/model/sensor.entity';
import { Field } from '../../../domain/model/field.entity';

import { ReportApiService } from '../../../infrastructure/report-api.service';
import { SensorApiService } from '../../../infrastructure/sensor-api.service';
import { FieldApiService } from '../../../infrastructure/field-api.service';

@Component({
  selector: 'app-sensor-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sensor-history.html',
  styleUrl: './sensor-history.css',
})
export class SensorHistory implements OnInit {
  reports: Report[] = [];
  sensors: Sensor[] = [];
  fields: Field[] = [];

  loading = true;
  errorMessage = '';

  constructor(
    private readonly reportApiService: ReportApiService,
    private readonly sensorApiService: SensorApiService,
    private readonly fieldApiService: FieldApiService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadFields();
  }

  private loadFields(): void {
    this.loading = true;
    this.errorMessage = '';

    this.fieldApiService.getAll().subscribe({
      next: (fields: Field[]) => {
        this.fields = [...fields];
        this.loadSensors();
      },

      error: (error) => {
        console.error('ERROR CARGANDO CAMPOS:', error);
        this.handleError();
      },
    });
  }

  private loadSensors(): void {
    this.sensorApiService.getAll().subscribe({
      next: (sensors: Sensor[]) => {
        this.sensors = [...sensors];
        this.loadReports();
      },

      error: (error) => {
        console.error('ERROR CARGANDO SENSORES:', error);
        this.handleError();
      },
    });
  }

  private loadReports(): void {
    this.reportApiService.getAll().subscribe({
      next: (reports: Report[]) => {
        this.reports = [...reports].sort(
          (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
        );

        this.loading = false;
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('ERROR CARGANDO HISTORIAL:', error);
        this.handleError();
      },
    });
  }

  getSensorCode(deviceId: number): string {
    const sensor = this.sensors.find((item) => Number(item.id) === Number(deviceId));

    return sensor ? sensor.code : `Sensor ${deviceId}`;
  }

  getFieldName(deviceId: number): string {
    const sensor = this.sensors.find((item) => Number(item.id) === Number(deviceId));

    if (!sensor) {
      return 'Sin zona';
    }

    const field = this.fields.find((item) => Number(item.id) === Number(sensor.fieldId));

    return field ? field.name : `Campo ${sensor.fieldId}`;
  }

  goToSummary(): void {
    this.router.navigate(['/monitoring']);
  }

  private handleError(): void {
    this.errorMessage = 'No se pudo cargar el historial de humedad.';
    this.loading = false;
    this.cdr.detectChanges();
  }
}
