import {computed, inject, Service, signal} from '@angular/core';
import {InventoryApi} from '../infrastructure/inventory-api';
import {Inventory} from '../domain/model/inventory.entity';
import {catchError, forkJoin, map, Observable, of, switchMap, tap, throwError} from 'rxjs';
import {InventoryAssembler} from '../infrastructure/inventory.assembler';
import {InventoryResource} from '../infrastructure/inventory-response';
import {UpdateStockRequest} from '../infrastructure/update-stock.request';
import {AuthService} from '../../iam/application/auth.service';
import {ProfileContextService} from '../../profile/application/profile-context.service';
import {ProductApi} from '../infrastructure/product-api';
import {Product} from '../domain/model/product.entity';
import {CreateInventoryRequest} from '../infrastructure/create-inventory.request';
import {ProductAssembler} from '../infrastructure/product.assembler';
import {FieldApi} from '../../profile/infrastructure/field-api';
import {FieldResource} from '../../profile/infrastructure/field-response';
import {Field} from '../../profile/domain/model/field.entity';
import {FieldAssembler} from '../../profile/infrastructure/field.assembler';
import {CreateProductRequest} from '../infrastructure/create-product.request';
import {LOW_STOCK_THRESHOLD} from '../domain/model/stock.constants';
import {NotificationEventService} from '../../notification/application/notification-event.service';

export type StockCriteriaFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

/** Result of registering a product together with its initial inventory record. */
export interface ProductRegistration {
  product: Product;
  inventory: Inventory;
}

@Service()
export class StockStore {
  private inventoryApi = inject(InventoryApi);
  private productApi = inject(ProductApi);
  private fieldApi = inject(FieldApi);
  private authService = inject(AuthService);
  private profileContext = inject(ProfileContextService);
  private notificationEvents = inject(NotificationEventService);

  private readonly _inventories = signal<Inventory[]>([]);
  private readonly _allInventories = signal<Inventory[]>([]);
  private readonly _products = signal<Product[]>([]);
  private readonly _fields = signal<Field[]>([]);
  private readonly _farmFieldIds = signal<number[]>([]);
  readonly loading = signal<boolean>(false);

  readonly searchTerm = signal<string>('');
  readonly selectedFieldId = signal<number | null>(null);
  readonly stockCriteria = signal<StockCriteriaFilter>('ALL');

  readonly inventories = computed(() => {
    const user = this.authService.currentUser();
    if (!user) {
      return [];
    }
    return this._inventories();
  });

  /** Fields (batches) of the active farm, used by product and inventory forms. */
  readonly fields = computed(() => this._fields());

  /**
   * Products visible for the active farm: global products plus those owned by
   * one of the farm's fields (`products.field_id`).
   */
  readonly products = computed(() => {
    const farmFieldIds = new Set(this._farmFieldIds());
    if (farmFieldIds.size === 0) {
      return this._products();
    }
    return this._products().filter(
      (product) => product.fieldId === null || product.fieldId === undefined || farmFieldIds.has(Number(product.fieldId))
    );
  });

  /**
   * Field identifiers linked to the catalog products. Exposed so other bounded
   * contexts (for example Analytics) can relate products with their batches.
   */
  readonly productFieldIds = computed<number[]>(() => {
    const fieldIds = new Set<number>();
    for (const product of this._products()) {
      if (product.fieldId !== null && product.fieldId !== undefined) {
        fieldIds.add(Number(product.fieldId));
      }
    }
    return Array.from(fieldIds);
  });

  readonly productByIdMap = computed(() => {
    const mapById = new Map<number, Product>();
    for (const product of this._products()) {
      mapById.set(Number(product.id), product);
    }
    return mapById;
  });

  readonly fieldByIdMap = computed(() => {
    const mapById = new Map<number, Field>();
    for (const field of this._fields()) {
      mapById.set(Number(field.id), field);
    }
    return mapById;
  });

  readonly filteredInventories = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const fieldFilter = this.selectedFieldId();
    const criteria = this.stockCriteria();
    const productMap = this.productByIdMap();
    const fieldMap = this.fieldByIdMap();

    return this.inventories().filter((item) => {
      const product = productMap.get(Number(item.productId));
      const batchId = Number(item.fieldId ?? product?.fieldId);
      const batchName = (fieldMap.get(batchId)?.name ?? '').toLowerCase();

      if (term.length > 0) {
        const productName = (product?.name ?? '').toLowerCase();
        const productDescription = (product?.description ?? '').toLowerCase();
        const matchesProduct = productName.includes(term) || productDescription.includes(term);
        if (!matchesProduct && !batchName.includes(term)) {
          return false;
        }
      }

      if (fieldFilter !== null && batchId !== fieldFilter) {
        return false;
      }

      if (criteria === 'IN_STOCK' && item.stockQuantity <= LOW_STOCK_THRESHOLD) {
        return false;
      }
      if (criteria === 'LOW_STOCK' && (item.stockQuantity <= 0 || item.stockQuantity > LOW_STOCK_THRESHOLD)) {
        return false;
      }
      if (criteria === 'OUT_OF_STOCK' && item.stockQuantity > 0) {
        return false;
      }

      return true;
    });
  });

  constructor() {
    this.authService.registerCleanup(() => this.clearState());
  }

  clearState(): void {
    this._inventories.set([]);
    this._allInventories.set([]);
    this._products.set([]);
    this._fields.set([]);
    this._farmFieldIds.set([]);
    this.searchTerm.set('');
    this.selectedFieldId.set(null);
    this.stockCriteria.set('ALL');
    this.loading.set(false);
  }

  setSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  setSelectedFieldId(fieldId: number | null): void {
    this.selectedFieldId.set(fieldId);
  }

  setStockCriteria(criteria: StockCriteriaFilter): void {
    this.stockCriteria.set(criteria);
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.selectedFieldId.set(null);
    this.stockCriteria.set('ALL');
  }

  getProduct(productId: number): Product | undefined {
    return this.productByIdMap().get(Number(productId));
  }

  getProductName(productId: number): string {
    return this.getProduct(productId)?.name ?? `#${productId}`;
  }

  getFieldName(fieldId: number | null | undefined): string {
    if (fieldId === null || fieldId === undefined) {
      return '';
    }
    return this.fieldByIdMap().get(Number(fieldId))?.name ?? '';
  }

  isProductAvailable(productId: number): boolean {
    const records = this._allInventories().filter(item => Number(item.productId) === Number(productId));
    if (records.length === 0) {
      return true;
    }
    return records.some(item => item.stockQuantity > 0);
  }

  loadInventories(): Observable<Inventory[]> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this._inventories.set([]);
      return of([]);
    }

    this.loading.set(true);

    return this.profileContext.fetchCurrentProfile().pipe(
      switchMap((profile) => {
        if (!profile) {
          this._inventories.set([]);
          this._allInventories.set([]);
          this._products.set([]);
          this._fields.set([]);
          this.loading.set(false);
          return of([]);
        }

        return forkJoin({
          inventoriesRaw: this.inventoryApi.getInventoriesByProfileId(profile.id),
          productsRaw: this.productApi.getProducts().pipe(catchError(() => of([]))),
          fieldsRaw: this.fieldApi.getFields(profile.id).pipe(catchError(() => of<FieldResource[]>([])))
        }).pipe(
          map(({ inventoriesRaw, productsRaw, fieldsRaw }) => {
            const fields = fieldsRaw.filter((field) => Number(field.profile_id) === Number(profile.id));
            this._fields.set(fields.map((res) => FieldAssembler.toEntityFromResource(res)));
            this._farmFieldIds.set(fields.map((field) => Number(field.id)));
            this._products.set(productsRaw.map((res) => ProductAssembler.toEntityFromResource(res)));

            return inventoriesRaw
              .map((res) => InventoryAssembler.toEntityFromResource(res))
              .filter((item) => Number(item.profileId) === Number(profile.id));
          }),
          tap((userInventories) => {
            this._inventories.set(userInventories);
            this._allInventories.set(userInventories);
            this.loading.set(false);
          })
        );
      }),
      catchError((error) => {
        this.loading.set(false);
        return throwError(() => error);
      })
    );
  }

  loadProducts(): Observable<Product[]> {
    this.loading.set(true);
    return this.profileContext.fetchCurrentProfile().pipe(
      catchError(() => of(null)),
      switchMap((profile) => forkJoin({
        productsRaw: this.productApi.getProducts(),
        inventoriesRaw: profile
          ? this.inventoryApi.getInventoriesByProfileId(profile.id).pipe(catchError(() => of<InventoryResource[]>([])))
          : of<InventoryResource[]>([]),
        fieldsRaw: profile
          ? this.fieldApi.getFields(profile.id).pipe(catchError(() => of<FieldResource[]>([])))
          : of<FieldResource[]>([])
      }).pipe(
        map(({ productsRaw, inventoriesRaw, fieldsRaw }) => {
          const fields = profile
            ? fieldsRaw.filter((field) => Number(field.profile_id) === Number(profile.id))
            : [];
          this._fields.set(fields.map((res) => FieldAssembler.toEntityFromResource(res)));
          this._farmFieldIds.set(fields.map((field) => Number(field.id)));
          this._allInventories.set(
            inventoriesRaw.map((res) => InventoryAssembler.toEntityFromResource(res))
          );
          return productsRaw.map((res) => ProductAssembler.toEntityFromResource(res));
        })
      )),
      tap((products) => {
        this._products.set(products);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        return throwError(() => error);
      })
    );
  }

  createProduct(request: CreateProductRequest): Observable<Product> {
    return this.productApi.createProduct(request).pipe(
      map((resource) => ProductAssembler.toEntityFromResource(resource)),
      tap((newProduct) => {
        this._products.update((current) => [...current, newProduct]);
        this.notificationEvents.productCreated(newProduct);
      })
    );
  }

  /**
   * Registers a product in the catalog and its initial stock record in the
   * selected batch, keeping both operations in a single sequential flow.
   */
  createProductWithInventory(
    request: CreateProductRequest,
    stockQuantity: number
  ): Observable<ProductRegistration> {
    if (stockQuantity < 0) {
      return throwError(() => new Error('La cantidad inicial no puede ser negativa'));
    }

    const field = this.fieldByIdMap().get(Number(request.fieldId));
    const profileId = field?.profileId ?? this.profileContext.currentProfileId() ?? undefined;

    return this.createProduct(request).pipe(
      switchMap((product) => this.createInventory({
        productId: product.id,
        profileId,
        fieldId: Number(request.fieldId),
        stockQuantity,
      }).pipe(
        map((inventory) => ({ product, inventory }))
      ))
    );
  }

  createInventory(request: CreateInventoryRequest): Observable<Inventory> {
    if (request.stockQuantity < 0) {
      return throwError(() => new Error('La cantidad inicial no puede ser negativa'));
    }

    const activeProfileId = this.profileContext.currentProfileId();
    const payload: CreateInventoryRequest = {
      ...request,
      profileId: request.profileId ?? activeProfileId ?? undefined
    };

    return this.inventoryApi.createInventory(payload).pipe(
      map((resource) => InventoryAssembler.toEntityFromResource(resource)),
      tap((newInventory) => {
        this._inventories.update((current) => [...current, newInventory]);
        this._allInventories.update((current) => [...current, newInventory]);
        this.notificationEvents.stockInitialized(
          newInventory,
          this.getProductName(newInventory.productId),
        );
      })
    );
  }

  updateStock(request: UpdateStockRequest): Observable<Inventory> {
    if (request.stockQuantity < 0) {
      return throwError(() => new Error('La cantidad de stock no puede ser negativa'));
    }

    const previousInventory =
      this._inventories().find((item) => Number(item.id) === Number(request.inventoryId)) ??
      this._allInventories().find((item) => Number(item.id) === Number(request.inventoryId));

    return this.inventoryApi.updateStockQuantity(request.inventoryId, request.stockQuantity).pipe(
      map((resource) => InventoryAssembler.toEntityFromResource(resource)),
      tap((updatedInventory) => {
        this._inventories.update((current) =>
          current.map((item) => (item.id === updatedInventory.id ? updatedInventory : item))
        );
        this._allInventories.update((current) =>
          current.map((item) => (item.id === updatedInventory.id ? updatedInventory : item))
        );
        this.notificationEvents.stockUpdated(
          updatedInventory,
          this.getProductName(updatedInventory.productId),
          previousInventory?.stockQuantity ?? null,
        );
      })
    );
  }
}
