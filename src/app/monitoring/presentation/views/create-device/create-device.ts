import {Component, inject, OnInit, output, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MonitoringStore} from '../../../application/monitoring.store';
import {Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  imports: [
    ReactiveFormsModule,
    TranslatePipe
  ],
  selector: 'app-create-device',
  styleUrl: './create-device.css',
  templateUrl: './create-device.html',
})
export class CreateDevice implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly monitoringStore = inject(MonitoringStore);
  private readonly router = inject(Router);

  deviceCreated = output<void>();
  cancel = output<void>();

  readonly fields = this.monitoringStore.fields;
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  deviceForm: FormGroup = this.fb.group({
    fieldId: ['', [Validators.required]],
    macAddress: ['', [Validators.required, Validators.pattern(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i)]]
  });

  ngOnInit(): void {
    if (this.fields().length === 0) {
      this.monitoringStore.loadMonitoringData().subscribe();
    }
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.deviceForm.invalid) {
      this.deviceForm.markAllAsTouched();
      return;
    }

    const { fieldId, macAddress } = this.deviceForm.value;
    const normalizedMac = String(macAddress).trim().toUpperCase();

    const duplicate = this.monitoringStore
      .devices()
      .some(d => d.macAddress.toUpperCase() === normalizedMac);

    if (duplicate) {
      this.errorMessage.set('monitoring.create-device.error-duplicate');
      return;
    }

    this.monitoringStore.createDevice({ fieldId: Number(fieldId), macAddress: normalizedMac }).subscribe({
      next: () => {
        this.successMessage.set('monitoring.create-device.success');
        this.deviceCreated.emit();
        this.deviceForm.reset({ fieldId: '', macAddress: '' });
        this.router.navigate(['/monitoring']);
      },
      error: () => {
        this.errorMessage.set('monitoring.create-device.error-submit');
      }
    });
  }

  onDeviceCreated(): void {
    this.router.navigate(['/monitoring']);
  }

  onCancel(): void {
    this.cancel.emit();
    this.router.navigate(['/monitoring']);
  }
}
