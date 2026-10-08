import { Service } from '@angular/core';
import { NotificationPreference } from '../domain/model/notification-preference.entity';
import { NotificationType } from '../domain/model/notification-type.enum';
import { NotificationPreferenceResource } from './notification-preference-resource';

@Service()
export class NotificationPreferenceAssembler {
  static toEntityFromResource(resource: NotificationPreferenceResource): NotificationPreference {
    const validType = Object.values(NotificationType).includes(resource.type as NotificationType)
      ? resource.type as NotificationType
      : NotificationType.SYSTEM_INFO;

    return new NotificationPreference(
      resource.id,
      resource.profile_id,
      validType,
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
      type: entity.type as string,
      field_id: entity.fieldId,
      enabled: entity.enabled,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
