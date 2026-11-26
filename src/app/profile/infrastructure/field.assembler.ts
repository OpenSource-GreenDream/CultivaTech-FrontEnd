import {FieldResource} from './field-response';
import {Field} from '../domain/model/field.entity';
import {Service} from '@angular/core';

@Service()
export class FieldAssembler {
  static toEntityFromResource(resource: FieldResource): Field {
    return new Field(
      resource.id,
      resource.profileId,
      resource.name,
      resource.sizeM2,
      resource.soilType,
      resource.latitude,
      resource.longitude,
    );
  }

  static toResourceFromEntity(entity: Field): FieldResource {
    return {
      id: entity.id,
      profileId: entity.profileId,
      name: entity.name,
      sizeM2: entity.sizeM2,
      soilType: entity.soilType,
      latitude: entity.latitude,
      longitude: entity.longitude,
    };
  }
}
