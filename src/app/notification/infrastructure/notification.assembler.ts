import { Service } from '@angular/core';
import { Notification } from '../domain/model/notification.entity';
import { NotificationResource } from './notification-resource';

@Service()
export class NotificationAssembler {
  static toEntityFromResource(resource: NotificationResource): Notification {
    return new Notification(
      resource.id,
      resource.profile_id,
      resource.title,
      resource.message,
      resource.is_read,
      resource.is_alert,
      resource.type,
      resource.field_id,
      resource.created_at,
      resource.updated_at,
    );
  }

  static toResourceFromEntity(entity: Notification): NotificationResource {
    return {
      id: entity.id,
      profile_id: entity.profileId,
      title: entity.title,
      message: entity.message,
      is_read: entity.isRead,
      is_alert: entity.isAlert,
      type: entity.type,
      field_id: entity.fieldId,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
