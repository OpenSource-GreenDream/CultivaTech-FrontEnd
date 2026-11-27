import {InventoryResource} from './inventory-response';
import {Inventory} from '../domain/model/inventory.entity';

export class InventoryAssembler {
  static toEntityFromResource(resource: InventoryResource): Inventory {
    return {
      id: resource.id,
      profileId: resource.profileId,
      fieldId: resource.fieldId,
      stockQuantity: resource.stockQuantity,
    };
  }

  static toResourceFromEntity(entity: Inventory): InventoryResource {
    return {
      id: entity.id,
      profileId: entity.profileId,
      fieldId: entity.fieldId,
      stockQuantity: entity.stockQuantity,
    };
  }
}