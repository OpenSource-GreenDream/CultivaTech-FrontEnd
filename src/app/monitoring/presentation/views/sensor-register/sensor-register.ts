import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { SensorApiService } from '../../../infrastructure/sensor-api.service';
import { FieldApiService } from '../../../infrastructure/field-api.service';
import { Field } from '../../../domain/model/field.entity';

@Component({
  selector: 'app-sensor-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sensor-register.html',
  styleUrl: './sensor-register.css',
})
export class SensorRegister implements OnInit {
  code = '';
  fieldId: number | null = null;

  fields: Field[] = [];

  loadingFields = true;
  saving = false;
  errorMessage = '';

  constructor(
    private readonly sensorApiService: SensorApiService,
    private readonly fieldApiService: FieldApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadFields();
  }

  loadFields(): void {
    this.loadingFields = true;

    this.fieldApiService.getAll().subscribe({
      next: (fields) => {
        this.fields = fields;
        this.loadingFields = false;
      },
      error: (error) => {
        console.error('ERROR CARGANDO CAMPOS:', error);
        this.errorMessage = 'No se pudieron cargar las zonas de cultivo.';
        this.loadingFields = false;
      },
    });
  }

  registerSensor(): void {
    if (!this.code.trim() || this.fieldId === null) {
      this.errorMessage = 'Completa todos los campos.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.sensorApiService
      .create({
        code: this.code.trim(),
        fieldId: Number(this.fieldId),
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/monitoring/sensors']);
        },
        error: (error) => {
          console.error('ERROR REGISTRANDO SENSOR:', error);
          this.errorMessage = 'No se pudo registrar el sensor.';
          this.saving = false;
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/monitoring/sensors']);
  }
}
