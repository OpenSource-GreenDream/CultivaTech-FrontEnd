import {Profile} from '../domain/model/profile.entity';
import {ProfileResource} from './profile.response';
import {Service} from '@angular/core';

@Service()
export class ProfileAssembler {
  static toEntityFromResource(resource: ProfileResource): Profile {
    return new Profile(
      resource.id,
      resource.userId,
      resource.fundoName,
      resource.contactPhone,
      resource.moistureThreshold,
      resource.temperatureThreshold,
    );
  }

  static toResourceFromEntity(entity: Profile): ProfileResource {
    return {
      id: entity.id,
      userId: entity.userId,
      fundoName: entity.fundoName,
      contactPhone: entity.contactPhone,
      moistureThreshold: entity.moistureThreshold,
      temperatureThreshold: entity.temperatureThreshold,
    };
  }
}
