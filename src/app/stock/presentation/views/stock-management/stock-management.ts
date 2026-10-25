import {Component, inject} from '@angular/core';
import {StockStore} from '../../../application/stock.store';
import {UpdateStockForm} from '../../components/update-stock-form/update-stock-form';
import {TranslatePipe} from '@ngx-translate/core';
import {InventoryList} from '../../components/inventory-list/inventory-list';
import {Router} from '@angular/router';
import {DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  imports: [
    DatePipe,
    FormsModule
  ],
  selector: 'app-stock-management',
  styleUrl: './stock-management.css',
  templateUrl: './stock-management.html',
})
export class StockManagement {
  private readonly stockStore = inject(StockStore);
  private readonly router = inject(Router);

  readonly inventories = this.stockStore.inventories;
  readonly loading = this.stockStore.loading;

  editingInventoryId: number | null = null;
  newStockValue: number = 0;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.stockStore.loadInventories().subscribe();
  }

  startEditing(inventoryId: number, currentQuantity: number): void {
    this.editingInventoryId = inventoryId;
    this.newStockValue = currentQuantity;
    this.errorMessage = null;
  }

  cancelEditing(): void {
    this.editingInventoryId = null;
    this.errorMessage = null;
  }

  saveStock(inventoryId: number): void {
    if (this.newStockValue < 0) {
      this.errorMessage = 'La cantidad no puede ser negativa.';
      return;
    }

    this.stockStore.updateStock({ inventoryId, stockQuantity: this.newStockValue }).subscribe({
      next: () => {
        this.editingInventoryId = null;
        this.errorMessage = null;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al actualizar el stock.';
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
