import {HarvestProjectionResource} from './harvest-projection.response';
import {HarvestProjection} from '../domain/model/entity/harvest-projection.entity';

export class HarvestProjectionAssembler {
  static toEntityFromResource(resource: HarvestProjectionResource): HarvestProjection {
    return {
      id: resource.id,
      deviceId: resource.device_id,
      cropType: resource.crop_type,
      projectedYieldTons: resource.projected_yield_tons,
      historicalYieldTons: resource.historical_yield_tons,
      projectionPeriod: resource.projection_period,
      confidenceScore: resource.confidence_score,
      createdAt: resource.created_at
    };
  }

  static toResourceFromEntity(entity: HarvestProjection): HarvestProjectionResource {
    return {
      id: entity.id,
      device_id: entity.deviceId,
      crop_type: entity.cropType,
      projected_yield_tons: entity.projectedYieldTons,
      historical_yield_tons: entity.historicalYieldTons,
      projection_period: entity.projectionPeriod,
      confidence_score: entity.confidenceScore,
      created_at: entity.createdAt
    };
  }
}
