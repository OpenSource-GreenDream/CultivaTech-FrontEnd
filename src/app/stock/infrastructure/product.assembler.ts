import {ProductResource} from './product-response';
import {Product} from '../domain/model/product.entity';

export class ProductAssembler {
  static toEntityFromResource(resource: ProductResource): Product {
    return {
      id: resource.id,
      inventoryId: resource.inventoryId,
      fieldId: resource.fieldId ?? null,
      name: resource.name,
      description: resource.description,
      price: resource.price,
      type: resource.type,
      imageUrl: resource.imageUrl,
    };
  }

  static toResourceFromEntity(entity: Product): ProductResource {
    return {
      id: entity.id,
      inventoryId: entity.inventoryId,
      fieldId: entity.fieldId,
      name: entity.name,
      description: entity.description,
      price: entity.price,
      type: entity.type,
      imageUrl: entity.imageUrl,
    };
  }
}