import { inject, Service, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { StockApi } from '../infrastructure/stock-api';
import { Supply } from '../domain/model/supply.entity';
import { CreateSupplyRequest } from '../domain/model/create-supply.request';
import { UpdateStockRequest } from '../domain/model/update-stock.request';
import { SupplyAssembler } from '../infrastructure/supply.assembler';

/**
 * Application service store for the Stock Management Bounded Context.
 */
@Service()
export class StockStore {
  private stockApi = inject(StockApi);

  readonly supplies = signal<Supply[]>([]);

  /**
   * Retrieves the supplies registered in the inventory.
   */
  loadSupplies(): Observable<Supply[]> {
    return this.stockApi.getSupplies().pipe(
      tap(resources => {
        const supplies = resources.map(resource =>
          SupplyAssembler.toEntityFromResource(resource)
        );

        this.supplies.set(supplies);
      })
    );
  }

  /**
   * Registers a new supply.
   */
  createSupply(request: CreateSupplyRequest): Observable<Supply> {
    return this.stockApi.createSupply(request).pipe(
      tap(resource => {
        const supply = SupplyAssembler.toEntityFromResource(resource);

        this.supplies.update(supplies => [
          ...supplies,
          supply
        ]);
      })
    );
  }

  /**
   * Updates the stock quantity of a supply.
   */
  updateStock(
    id: string,
    request: UpdateStockRequest
  ): Observable<Supply> {
    return this.stockApi.updateStock(id, request).pipe(
      tap(resource => {
        const updatedSupply =
          SupplyAssembler.toEntityFromResource(resource);

        this.supplies.update(supplies =>
          supplies.map(supply =>
            supply.id === id ? updatedSupply : supply
          )
        );
      })
    );
  }
}
