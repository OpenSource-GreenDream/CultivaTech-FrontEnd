import {Component, inject, OnInit, signal} from '@angular/core';
import {StockCriteriaFilter, StockStore} from '../../../application/stock.store';
import {TranslatePipe} from '@ngx-translate/core';
import {Router} from '@angular/router';
import {CurrencyPipe, DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Product} from '../../../domain/model/product.entity';

@Component({
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    TranslatePipe
  ],
  selector: 'app-stock-management',
  styleUrl: './stock-management.css',
  templateUrl: './stock-management.html',
})
export class StockManagement implements OnInit {
  private readonly stockStore = inject(StockStore);
  private readonly router = inject(Router);

  readonly inventories = this.stockStore.inventories;
  readonly filteredInventories = this.stockStore.filteredInventories;
  readonly fields = this.stockStore.fields;
  readonly searchTerm = this.stockStore.searchTerm;
  readonly selectedFieldId = this.stockStore.selectedFieldId;
  readonly stockCriteria = this.stockStore.stockCriteria;
  readonly loading = this.stockStore.loading;

  readonly editingInventoryId = signal<number | null>(null);
  readonly newStockValue = signal<number | null>(0);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.stockStore.loadInventories().subscribe();
  }

  getProduct(productId: number): Product | undefined {
    return this.stockStore.getProduct(productId);
  }

  getProductName(productId: number): string {
    return this.stockStore.getProductName(productId);
  }

  getFieldName(fieldId: number | null | undefined): string {
    return this.stockStore.getFieldName(fieldId);
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.stockStore.setSearchTerm(value);
  }

  onFieldChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.stockStore.setSelectedFieldId(value ? Number(value) : null);
  }

  onCriteriaChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as StockCriteriaFilter;
    this.stockStore.setStockCriteria(value);
  }

  clearFilters(): void {
    this.stockStore.resetFilters();
  }

  startEditing(inventoryId: number, currentQuantity: number): void {
    this.editingInventoryId.set(inventoryId);
    this.newStockValue.set(currentQuantity);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  cancelEditing(): void {
    this.editingInventoryId.set(null);
    this.errorMessage.set(null);
  }

  onStockInputChange(value: number | string | null): void {
    if (value === null || value === undefined || String(value).trim() === '') {
      this.newStockValue.set(null);
      return;
    }
    const numericValue = Number(value);
    this.newStockValue.set(Number.isFinite(numericValue) ? numericValue : null);
  }

  isStockValueInvalid(): boolean {
    const quantity = this.newStockValue();
    return quantity === null || Number.isNaN(Number(quantity)) || Number(quantity) < 0;
  }

  saveStock(inventoryId: number): void {
    const quantity = this.newStockValue();
    if (quantity === null || quantity === undefined || Number.isNaN(Number(quantity)) || Number(quantity) < 0) {
      this.errorMessage.set('stock.update.error-invalid-quantity');
      return;
    }

    this.stockStore.updateStock({ inventoryId, stockQuantity: Number(quantity) }).subscribe({
      next: () => {
        this.editingInventoryId.set(null);
        this.errorMessage.set(null);
        this.successMessage.set('stock.update.success');
      },
      error: () => {
        this.errorMessage.set('stock.update.error-submit');
      }
    });
  }

  goToCreateSupply(): void {
    this.router.navigate(['/stock/create-supply']);
  }

  goToCatalog(): void {
    this.router.navigate(['/stock/catalog']);
  }
}
