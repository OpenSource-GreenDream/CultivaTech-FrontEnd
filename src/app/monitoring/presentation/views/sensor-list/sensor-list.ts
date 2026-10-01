import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Sensor } from '../../../domain/model/sensor.entity';
import { Field } from '../../../domain/model/field.entity';
import { SensorApiService } from '../../../infrastructure/sensor-api.service';
import { FieldApiService } from '../../../infrastructure/field-api.service';

@Component({
  selector: 'app-sensor-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sensor-list.html',
  styleUrl: './sensor-list.css',
})
export class SensorList implements OnInit {
  sensors: Sensor[] = [];
  fields: Field[] = [];

  loading = true;
  errorMessage = '';

  constructor(
    private readonly sensorApiService: SensorApiService,
    private readonly fieldApiService: FieldApiService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadFields();
  }

  loadFields(): void {
    this.loading = true;
    this.errorMessage = '';

    this.fieldApiService.getAll().subscribe({
      next: (fields: Field[]) => {

        this.fields = [...fields];

        this.loadSensors();
      },

      error: (error) => {
        console.error('ERROR CARGANDO CAMPOS:', error);

        this.errorMessage = 'No se pudieron cargar las zonas de cultivo.';

        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadSensors(): void {
    this.sensorApiService.getAll().subscribe({
      next: (sensors: Sensor[]) => {

        this.sensors = [...sensors];
        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('ERROR CARGANDO SENSORES:', error);

        this.errorMessage = 'No se pudieron cargar los sensores registrados.';

        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  getFieldName(fieldId: number): string {
    const field = this.fields.find((field) => Number(field.id) === Number(fieldId));

    return field ? field.name : `Campo ${fieldId}`;
  }

  registerSensor(): void {
    this.router.navigate(['/monitoring/sensors/register']);
  }
}
