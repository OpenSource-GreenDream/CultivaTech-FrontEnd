import { Service } from '@angular/core';
import { NotificationPreference } from '../domain/model/notification-preference.entity';
import { NotificationPreferenceResource } from './notification-preference-resource';

@Service()
export class NotificationPreferenceAssembler {
  static toEntityFromResource(resource: NotificationPreferenceResource): NotificationPreference {
    return new NotificationPreference(
      resource.id,
      resource.profile_id,
      resource.type,
      resource.field_id,
      resource.enabled,
      resource.created_at,
      resource.updated_at,
    );
  }

  static toResourceFromEntity(entity: NotificationPreference): NotificationPreferenceResource {
    return {
      id: entity.id,
      profile_id: entity.profileId,
      type: entity.type,
      field_id: entity.fieldId,
      enabled: entity.enabled,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
