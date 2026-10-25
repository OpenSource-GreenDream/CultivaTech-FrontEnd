import {Component, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {StockStore} from '../../../application/stock.store';
import {Router} from '@angular/router';

@Component({
  imports: [
    ReactiveFormsModule
  ],
  selector: 'app-create-supply',
  styleUrl: './create-supply.css',
  templateUrl: './create-supply.html',
})
export class CreateSupply {
  private readonly fb = inject(FormBuilder);
  private readonly stockStore = inject(StockStore);
  private readonly router = inject(Router);
  readonly products = this.stockStore.products;

  supplyForm: FormGroup = this.fb.group({
    productId: ['', [Validators.required, Validators.min(1)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    stockQuantity: [0, [Validators.required, Validators.min(0)]],
    warehouseLocation: ['', [Validators.required, Validators.minLength(3)]],
  });

  ngOnInit(): void {
    this.stockStore.loadProducts().subscribe();
  }

  onSubmit(): void {
    if (this.supplyForm.valid) {
      const { productId, stockQuantity, warehouseLocation } = this.supplyForm.value;
      const selectedProduct = this.products().find(p => Number(p.id) === Number(productId));

      this.stockStore.createInventory({
        productId: Number(productId),
        name: selectedProduct ? selectedProduct.name : 'Insumo Agrícola',
        stockQuantity: Number(stockQuantity),
        warehouseLocation,
      }).subscribe({
        next: () => this.router.navigate(['/stock']),
        error: (err) => console.error('Error registrando insumo:', err)
      });
    } else {
      this.supplyForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/stock']);
  }
}
