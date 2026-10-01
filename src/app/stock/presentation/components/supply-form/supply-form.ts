import { Component, output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CreateSupplyRequest } from '../../../domain/model/create-supply.request';

@Component({
  imports: [
    ReactiveFormsModule,
    TranslatePipe
  ],
  selector: 'app-supply-form',
  styleUrl: './supply-form.css',
  templateUrl: './supply-form.html',
})
export class SupplyForm {
  submitForm = output<CreateSupplyRequest>();

  supplyForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.supplyForm = this.fb.group({
      name: ['', [Validators.required]],
      quantity: ['', [Validators.required, Validators.min(0.01)]],
      unit: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.supplyForm.valid) {
      this.submitForm.emit(this.supplyForm.value);
    } else {
      this.supplyForm.markAllAsTouched();
    }
  }
}
