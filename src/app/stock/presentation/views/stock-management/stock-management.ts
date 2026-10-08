import {Component, inject, ViewChild} from '@angular/core';
import {StockStore} from '../../../application/stock.store';
import {UpdateStockForm} from '../../components/update-stock-form/update-stock-form';
import {UpdateStockRequest} from '../../../domain/model/update-stock.request';
import {TranslatePipe} from '@ngx-translate/core';
import {InventoryList} from '../../components/inventory-list/inventory-list';

@Component({
  imports: [
    TranslatePipe,
    UpdateStockForm,
    InventoryList
  ],
  selector: 'app-stock-management',
  styleUrl: './stock-management.css',
  templateUrl: './stock-management.html',
})
export class StockManagement {
  private stockStore = inject(StockStore);

  @ViewChild(UpdateStockForm)
  private updateForm!: UpdateStockForm;

  readonly inventories = this.stockStore.inventories;
  successMessage = false;

  ngOnInit(): void {
    this.stockStore.loadInventories().subscribe();
  }

  onUpdateStock(request: UpdateStockRequest): void {
    this.successMessage = false;
    this.stockStore.updateStock(request).subscribe({
      next: () => {
        this.successMessage = true;
        this.updateForm?.reset();
        setTimeout(() => (this.successMessage = false), 3000);
      },
      error: (err) => console.error('Error al actualizar el stock:', err)
    });
  }
}
