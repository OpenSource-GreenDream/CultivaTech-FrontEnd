import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Sensor } from '../../../domain/model/sensor.entity';
import { Field } from '../../../domain/model/field.entity';
import { Report } from '../../../domain/model/report.entity';

import { SensorApiService } from '../../../infrastructure/sensor-api.service';
import { FieldApiService } from '../../../infrastructure/field-api.service';
import { ReportApiService } from '../../../infrastructure/report-api.service';

@Component({
  selector: 'app-sensor-monitoring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sensor-monitoring.html',
  styleUrl: './sensor-monitoring.css',
})
export class SensorMonitoring implements OnInit {
  sensors: Sensor[] = [];
  fields: Field[] = [];
  reports: Report[] = [];

  // US12 - Zona seleccionada
  selectedFieldId: number | null = null;

  loading = true;
  errorMessage = '';

  constructor(
    private readonly sensorApiService: SensorApiService,
    private readonly fieldApiService: FieldApiService,
    private readonly reportApiService: ReportApiService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
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

        if (this.sensors.length === 0) {
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

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
        this.reports = [...reports];
        this.loading = false;

        console.log('REPORTES RECIBIDOS:', reports);

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('ERROR CARGANDO REPORTES:', error);
        this.handleError();
      },
    });
  }

  getFieldName(fieldId: number): string {
    const field = this.fields.find((item) => Number(item.id) === Number(fieldId));

    return field ? field.name : `Campo ${fieldId}`;
  }

  getReport(sensorId: number): Report | undefined {
    return this.reports.find((report) => Number(report.deviceId) === Number(sensorId));
  }

  onFieldChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    this.selectedFieldId = value === '' ? null : Number(value);
  }

  get filteredSensors(): Sensor[] {
    if (this.selectedFieldId === null) {
      return this.sensors;
    }

    return this.sensors.filter((sensor) => Number(sensor.fieldId) === Number(this.selectedFieldId));
  }

  goToHistory(): void {
    this.router.navigate(['/monitoring/sensor-history']);
  }

  private handleError(): void {
    this.errorMessage = 'No se pudieron cargar los datos de monitoreo.';
    this.loading = false;
    this.cdr.detectChanges();
  }
}
