import {Service} from '@angular/core';
import {ProductResource} from './product-response';
import {Product} from '../domain/model/product.entity';

@Service()
export class ProductAssembler {
  static toEntityFromResource(resource: ProductResource): Product {
    return {
      id: resource.id,
      name: resource.name,
      description: resource.description,
      price: resource.price,
      category: resource.category,
      isAvailable: resource.is_available,
      imageUrl: resource.image_url,
      createdAt: resource.created_at,
      updatedAt: resource.updated_at,
    };
  }

  static toResourceFromEntity(entity: Product): ProductResource {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      price: entity.price,
      category: entity.category,
      is_available: entity.isAvailable,
      image_url: entity.imageUrl,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
