import { Component, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { CreateStockMovementRequest } from '../../../domain/model';
import { StockMovementType } from '../../../domain/model';

@Component({
  imports: [ReactiveFormsModule, TranslatePipe],
  selector: 'app-stock-movement-form',
  styleUrl: './stock-movement-form.css',
  templateUrl: './stock-movement-form.html',
})
export class StockMovementForm {
  submitForm = output<CreateStockMovementRequest>();

  movementForm: FormGroup;

  movementTypes: StockMovementType[] = ['IN', 'OUT'];

  constructor(private fb: FormBuilder) {
    this.movementForm = this.fb.group({
      supplyId: ['', [Validators.required]],
      type: ['IN', [Validators.required]],
      quantity: ['', [Validators.required, Validators.min(0.01)]],
    });
  }

  onSubmit(): void {
    if (this.movementForm.valid) {
      this.submitForm.emit(this.movementForm.value);
    } else {
      this.movementForm.markAllAsTouched();
    }
  }

  reset(): void {
    this.movementForm.reset({
      supplyId: '',
      type: 'IN',
      quantity: '',
    });
  }
}
