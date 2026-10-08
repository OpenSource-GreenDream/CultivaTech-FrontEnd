import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { StockMovementForm } from '../../components/stock-movement-form/stock-movement-form';
import { StockMovementList } from '../../components/stock-movement-list/stock-movement-list';

import { StockMovementStore } from '../../../application/stock-movement.store';
import { CreateStockMovementRequest } from '../../../domain/model';

@Component({
  imports: [TranslatePipe, StockMovementForm, StockMovementList],
  selector: 'app-stock-movements',
  styleUrl: './stock-movements.css',
  templateUrl: './stock-movements.html',
})
export class StockMovements {
  private stockMovementStore = inject(StockMovementStore);

  readonly movements = this.stockMovementStore.movements;

  successMessage = false;

  ngOnInit(): void {
    this.loadMovements();
  }

  private loadMovements(): void {
    this.stockMovementStore.loadMovements().subscribe({
      error: (error) => {
        console.error('Error loading stock movements', error);
      },
    });
  }

  onCreateMovement(request: CreateStockMovementRequest): void {
    this.successMessage = false;

    this.stockMovementStore.createMovement(request).subscribe({
      next: () => {
        this.successMessage = true;
      },
      error: (error) => {
        console.error('Error creating stock movement', error);
      },
    });
  }
}
