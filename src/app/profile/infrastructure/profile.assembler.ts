import {Profile} from '../domain/model/profile.entity';
import {ProfileResource} from './profile.response';
import {Service} from '@angular/core';

/**
 * Assembler to transform Profile resources and entities.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class ProfileAssembler {
  static toEntityFromResource(resource: ProfileResource): Profile {
    return new Profile(
      resource.id,
      resource.user_id,
      resource.fundo_name,
      resource.contact_phone,
      resource.moisture_threshold,
      resource.temp_threshold
    );
  }

  static toResourceFromEntity(entity: Profile): ProfileResource {
    const nowISO = new Date().toISOString();
    return {
      id: entity.id,
      user_id: entity.userId,
      fundo_name: entity.fundoName,
      contact_phone: entity.contactPhone,
      moisture_threshold: entity.moistureThreshold,
      temp_threshold: entity.tempThreshold,
      created_at: nowISO,
      updated_at: nowISO,
    };
  }
}
