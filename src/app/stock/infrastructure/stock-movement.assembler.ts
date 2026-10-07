import { Service } from '@angular/core';
import { StockMovement } from '../domain/model';
import { StockMovementResource } from './stock-movement-response';

@Service()
export class StockMovementAssembler {
  static toEntityFromResource(resource: StockMovementResource): StockMovement {
    return {
      id: resource.id,
      supplyId: resource.supplyId,
      type: resource.type,
      quantity: resource.quantity,
      createdAt: resource.createdAt,
    };
  }

  static toResourceFromEntity(entity: StockMovement): StockMovementResource {
    return {
      id: entity.id,
      supplyId: entity.supplyId,
      type: entity.type,
      quantity: entity.quantity,
      createdAt: entity.createdAt,
    };
  }
}
