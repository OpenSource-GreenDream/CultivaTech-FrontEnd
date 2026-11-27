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
import {ProducerInfo} from '../domain/model/producer-info';
import {CommunityApi} from '../../community/infrastructure/community-api';
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
  private communityApi = inject(CommunityApi);
  private authService = inject(AuthService);
  private profileContext = inject(ProfileContextService);
  private notificationEvents = inject(NotificationEventService);

  private readonly _inventories = signal<Inventory[]>([]);
  private readonly _allInventories = signal<Inventory[]>([]);
  private readonly _products = signal<Product[]>([]);
  private readonly _fields = signal<Field[]>([]);
  readonly selectedProducer = signal<ProducerInfo | null>(null);
  readonly producerLoading = signal<boolean>(false);
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

  readonly productByInventoryIdMap = computed(() => {
    const mapByInventory = new Map<number, Product>();
    for (const product of this._products()) {
      mapByInventory.set(Number(product.inventoryId), product);
    }
    return mapByInventory;
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
    const productMap = this.productByInventoryIdMap();
    const fieldMap = this.fieldByIdMap();

    return this.inventories().filter((item) => {
      const product = productMap.get(Number(item.id));
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

  loadProducer(productId: number): Observable<void> {
    this.producerLoading.set(true);
    this.selectedProducer.set(null);
    return this.productApi.getProducer(productId).pipe(
      switchMap((producer) => {
        const info: ProducerInfo = {
          profileId: producer.profileId,
          fundoName: producer.fundoName,
          contactPhone: producer.contactPhone,
        };
        return this.communityApi.getAllCommunityProfiles(producer.profileId).pipe(
          map((profiles) => {
            const cp = profiles && profiles.length > 0 ? profiles[0] : null;
            if (cp) {
              info.nickname = cp.nickname;
              info.publicBio = cp.public_bio;
              info.reputationScore = cp.reputation_score;
              info.visibilityStatus = cp.visibility_status;
            }
            return info;
          }),
          catchError(() => of(info)),
        );
      }),
      tap((info) => {
        this.selectedProducer.set(info);
        this.producerLoading.set(false);
      }),
      map(() => void 0),
      catchError((error) => {
        this.producerLoading.set(false);
        return throwError(() => error);
      }),
    );
  }

  clearProducer(): void {
    this.selectedProducer.set(null);
    this.producerLoading.set(false);
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

  getProductByInventory(inventoryId: number): Product | undefined {
    return this.productByInventoryIdMap().get(Number(inventoryId));
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
    const product = this.productByIdMap().get(Number(productId));
    if (!product) return true;
    const record = this._allInventories().find(item => Number(item.id) === Number(product.inventoryId));
    if (!record) return true;
    return record.stockQuantity > 0;
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
          productsRaw: this.productApi.getProducts(),
          fieldsRaw: this.fieldApi.getFields(profile.id)
        }).pipe(
          map(({ inventoriesRaw, productsRaw, fieldsRaw }) => {
            const fields = fieldsRaw.filter((field) => Number(field.profileId) === Number(profile.id));
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
          ? this.inventoryApi.getInventoriesByProfileId(profile.id)
          : of<InventoryResource[]>([]),
        fieldsRaw: profile
          ? this.fieldApi.getFields(profile.id)
          : of<FieldResource[]>([])
      }).pipe(
        map(({ productsRaw, inventoriesRaw, fieldsRaw }) => {
          const fields = profile
            ? fieldsRaw.filter((field) => Number(field.profileId) === Number(profile.id))
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
    const profileId = field?.profileId ?? this.profileContext.currentProfileId();
    if (!profileId) {
      return throwError(() => new Error('No active profile'));
    }

    return this.createInventory({
      profileId,
      fieldId: Number(request.fieldId),
      stockQuantity,
    }).pipe(
      switchMap((inventory) => this.createProduct({
        ...request,
        inventoryId: inventory.id,
        fieldId: Number(request.fieldId),
        type: request.type ?? 'PRODUCT',
      }).pipe(
        map((product) => ({ product, inventory })),
        catchError((error) => {
          // keep inventory; propagate error
          return throwError(() => error);
        })
      ))
    );
  }

  createInventory(request: CreateInventoryRequest): Observable<Inventory> {
    if (request.stockQuantity < 0) {
      return throwError(() => new Error('La cantidad inicial no puede ser negativa'));
    }

    const activeProfileId = request.profileId ?? this.profileContext.currentProfileId();
    if (!activeProfileId) {
      return throwError(() => new Error('No active profile'));
    }

    return this.inventoryApi.createInventory(activeProfileId, {
      fieldId: request.fieldId,
      stockQuantity: request.stockQuantity,
    }).pipe(
      map((resource) => InventoryAssembler.toEntityFromResource(resource)),
      tap((newInventory) => {
        this._inventories.update((current) => [...current, newInventory]);
        this._allInventories.update((current) => [...current, newInventory]);
        this.notificationEvents.stockInitialized(
          newInventory,
          this.getFieldName(newInventory.fieldId) || 'Inventory',
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

    const fieldId = previousInventory?.fieldId ?? request.fieldId;
    if (fieldId === undefined) {
      return throwError(() => new Error('Missing fieldId'));
    }

    return this.inventoryApi.updateInventory(request.inventoryId, fieldId, request.stockQuantity).pipe(
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
          this.productByInventoryIdMap().get(Number(updatedInventory.id))?.name ?? 'Inventory',
          previousInventory?.stockQuantity ?? null,
        );
      })
    );
  }
}
