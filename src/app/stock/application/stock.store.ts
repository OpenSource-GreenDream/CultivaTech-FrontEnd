import {computed, inject, Service, signal} from '@angular/core';
import {InventoryApi} from '../infrastructure/inventory-api';
import {Inventory} from '../domain/model/inventory.entity';
import {catchError, map, Observable, tap, throwError} from 'rxjs';
import {InventoryAssembler} from '../infrastructure/inventory.assembler';
import {UpdateStockRequest} from '../domain/model/update-stock.request';
import {AuthService} from '../../iam/application/auth.service';

@Service()
export class StockStore {
  private inventoryApi = inject(InventoryApi);
  private authService = inject(AuthService);

  private readonly _inventories = signal<Inventory[]>([]);

  readonly inventories = computed(() => {
    const user = this.authService.currentUser();
    if (!user) {
      return [];
    }
    return this._inventories().filter(
      (item) => item.productId === user.id || item.id === user.id
    );
  });

  loadInventories(): Observable<Inventory[]> {
    return this.inventoryApi.getInventories().pipe(
      map((resources) => resources.map((res) => InventoryAssembler.toEntityFromResource(res))),
      tap((inventories) => this._inventories.set(inventories)),
      catchError((error) => {
        console.error('Error cargando inventarios:', error);
        return throwError(() => error);
      })
    );
  }

  updateStock(request: UpdateStockRequest): Observable<Inventory> {
    if (request.stockQuantity < 0) {
      return throwError(() => new Error('La cantidad de stock no puede ser negativa'));
    }

    return this.inventoryApi.updateStockQuantity(request.inventoryId, request.stockQuantity).pipe(
      map((resource) => InventoryAssembler.toEntityFromResource(resource)),
      tap((updatedInventory) => {
        this._inventories.update((current) =>
          current.map((item) => (item.id === updatedInventory.id ? updatedInventory : item))
        );
      })
    );
  }
}
