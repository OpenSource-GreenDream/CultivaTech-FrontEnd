import {Component, inject, output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MonitoringStore} from '../../../application/monitoring.store';
import {Router} from '@angular/router';

@Component({
  imports: [
    ReactiveFormsModule
  ],
  selector: 'app-create-device',
  styleUrl: './create-device.css',
  templateUrl: './create-device.html',
})
export class CreateDevice {
  private readonly fb = inject(FormBuilder);
  private readonly monitoringStore = inject(MonitoringStore);
  private readonly router = inject(Router);

  deviceCreated = output<void>();
  cancel = output<void>();

  readonly fields = this.monitoringStore.fields;

  deviceForm: FormGroup = this.fb.group({
    fieldId: ['', [Validators.required]],
    macAddress: ['', [Validators.required, Validators.pattern(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i)]]
  });

  onSubmit(){
    if (this.deviceForm.valid){
      const { fieldId, macAddress } = this.deviceForm.value;
      this.monitoringStore.createDevice({ fieldId: Number(fieldId), macAddress }).subscribe({
        next: ()=>{
          this.deviceCreated.emit();
          this.deviceForm.reset();
        },
        error: err => {
          console.error('Error de registro de sensor', err);
        }
      });
    }
    else {
      this.deviceForm.markAllAsTouched();
    }
  }

  onDeviceCreated(): void {
    this.router.navigate(['/monitoring']);
  }

  onCancel(){
    this.cancel.emit();
    this.router.navigate(['/monitoring']);
  }
}
