import {computed, inject, Service, signal} from '@angular/core';
import {InventoryApi} from '../infrastructure/inventory-api';
import {Inventory} from '../domain/model/inventory.entity';
import {catchError, map, Observable, tap, throwError} from 'rxjs';
import {InventoryAssembler} from '../infrastructure/inventory.assembler';
import {UpdateStockRequest} from '../infrastructure/update-stock.request';
import {AuthService} from '../../iam/application/auth.service';
import {ProductApi} from '../infrastructure/product-api';
import {Product} from '../domain/model/product.entity';
import {CreateInventoryRequest} from '../infrastructure/create-inventory.request';
import {ProductAssembler} from '../infrastructure/product.assembler';

@Service()
export class StockStore {
  private inventoryApi = inject(InventoryApi);
  private productApi = inject(ProductApi);
  private authService = inject(AuthService);

  private readonly _inventories = signal<Inventory[]>([]);
  private readonly _products = signal<Product[]>([]);
  readonly loading = signal<boolean>(false);

  readonly inventories = computed(() => {
    const user = this.authService.currentUser();
    if (!user) {
      return [];
    }
    return this._inventories();
  });

  readonly products = computed(() => this._products());

  loadInventories(): Observable<Inventory[]> {
    this.loading.set(true);
    return this.inventoryApi.getInventories().pipe(
      map((resources) => resources.map((res) => InventoryAssembler.toEntityFromResource(res))),
      tap((inventories) => {
        this._inventories.set(inventories);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        console.error('Error cargando inventarios:', error);
        return throwError(() => error);
      })
    );
  }

  loadProducts(): Observable<Product[]> {
    this.loading.set(true);
    return this.productApi.getProducts().pipe(
      map((resources) => resources.map((res) => ProductAssembler.toEntityFromResource(res))),
      tap((products) => {
        this._products.set(products);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        console.error('Error cargando productos:', error);
        return throwError(() => error);
      })
    );
  }

  createInventory(request: CreateInventoryRequest): Observable<Inventory> {
    if (request.stockQuantity < 0) {
      return throwError(() => new Error('La cantidad inicial no puede ser negativa'));
    }

    return this.inventoryApi.createInventory(request).pipe(
      map((resource) => InventoryAssembler.toEntityFromResource(resource)),
      tap((newInventory) => {
        this._inventories.update((current) => [...current, newInventory]);
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
