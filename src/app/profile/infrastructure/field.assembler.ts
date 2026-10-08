import {FieldResource} from './field.response';
import {Field} from '../domain/model/field.entity';
import {Service} from '@angular/core';

/**
 * Assembler to transform Field resources and entities.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class FieldAssembler {
  static toEntityFromResource(resource: FieldResource): Field {
    return new Field(
      resource.id,
      resource.profile_id,
      resource.name,
      resource.size_m2,
      resource.soil_type,
      resource.latitude,
      resource.longitude
    );
  }

  static toResourceFromEntity(entity: Field): FieldResource {
    const nowISO = new Date().toISOString();
    return {
      id: entity.id,
      profile_id: entity.profileId,
      name: entity.name,
      size_m2: entity.sizeM2,
      soil_type: entity.soilType,
      latitude: entity.latitude,
      longitude: entity.longitude,
      created_at: nowISO,
      updated_at: nowISO,
    };
  }
}
