import {Component, output} from '@angular/core';
import {UpdateStockRequest} from '../../../domain/model/update-stock.request';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  imports: [
    TranslatePipe,
    ReactiveFormsModule
  ],
  selector: 'app-update-stock-form',
  styleUrl: './update-stock-form.css',
  templateUrl: './update-stock-form.html',
})
export class UpdateStockForm {
  submitForm = output<UpdateStockRequest>();

  stockForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.stockForm = this.fb.group({
      inventoryId: ['', [Validators.required, Validators.min(1)]],
      stockQuantity: ['', [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.stockForm.valid) {
      this.submitForm.emit(this.stockForm.value);
    } else {
      this.stockForm.markAllAsTouched();
    }
  }

  reset(): void {
    this.stockForm.reset();
  }
}
