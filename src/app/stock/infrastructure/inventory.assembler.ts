import {InventoryResource} from './inventory-resource';
import {Inventory} from '../domain/model/inventory.entity';
import {Service} from '@angular/core';

@Service()
export class InventoryAssembler {
  static toEntityFromResource(resource: InventoryResource): Inventory {
    return {
      id: resource.id,
      productId: resource.product_id,
      stockQuantity: resource.stock_quantity,
      warehouseLocation: resource.warehouse_location,
      createdAt: resource.created_at,
      updatedAt: resource.updated_at,
    };
  }

  static toResourceFromEntity(entity: Inventory): InventoryResource {
    return {
      id: entity.id,
      product_id: entity.productId,
      stock_quantity: entity.stockQuantity,
      warehouse_location: entity.warehouseLocation,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
