import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {StockStore} from '../../../application/stock.store';
import {Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {STOCK_SUCCESS_NAVIGATION_DELAY_MS} from '../../../domain/model/stock.constants';

@Component({
  imports: [
    ReactiveFormsModule,
    TranslatePipe
  ],
  selector: 'app-create-supply',
  styleUrl: './create-supply.css',
  templateUrl: './create-supply.html',
})
export class CreateSupply implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly stockStore = inject(StockStore);
  private readonly router = inject(Router);
  private navigationTimer: ReturnType<typeof setTimeout> | null = null;

  readonly fields = this.stockStore.fields;
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isSubmitting = signal<boolean>(false);

  supplyForm: FormGroup = this.fb.group({
    fieldId: ['', [Validators.required]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    price: [null, [Validators.required, Validators.min(0)]],
    description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]],
    imageUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/i)]],
    stockQuantity: [null, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.stockStore.loadProducts().subscribe();
  }

  ngOnDestroy(): void {
    if (this.navigationTimer) {
      clearTimeout(this.navigationTimer);
    }
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.supplyForm.invalid) {
      this.supplyForm.markAllAsTouched();
      return;
    }

    const {fieldId, name, price, description, imageUrl, stockQuantity} = this.supplyForm.value;
    const selectedField = this.fields().find(field => Number(field.id) === Number(fieldId));

    if (!selectedField || Number(price) < 0 || Number(stockQuantity) < 0) {
      this.supplyForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.stockStore.createProductWithInventory({
      fieldId: Number(fieldId),
      name: String(name).trim(),
      price: Number(price),
      description: String(description).trim(),
      imageUrl: String(imageUrl).trim(),
    }, Number(stockQuantity)).subscribe({
      next: () => {
        this.successMessage.set('stock.success.registered');
        this.navigationTimer = setTimeout(
          () => this.router.navigate(['/stock']),
          STOCK_SUCCESS_NAVIGATION_DELAY_MS,
        );
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('stock.supply.error-submit');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/stock']);
  }
}
