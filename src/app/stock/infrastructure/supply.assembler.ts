import { Service } from '@angular/core';
import { Supply } from '../domain/model/supply.entity';
import { SupplyResource } from './supply-response';

/**
 * Service to transform API resources into domain entities
 * and domain entities into API resources.
 */
@Service()
export class SupplyAssembler {

  static toEntityFromResource(resource: SupplyResource): Supply {
    return {
      id: resource.id,
      name: resource.name,
      quantity: resource.quantity,
      unit: resource.unit
    };
  }

  static toResourceFromEntity(entity: Supply): SupplyResource {
    return {
      id: entity.id,
      name: entity.name,
      quantity: entity.quantity,
      unit: entity.unit
    };
  }
}
