import { Service } from '@angular/core';
import { Notification } from '../domain/model/notification.entity';
import { NotificationType } from '../domain/model/notification-type.enum';
import { NotificationResource } from './notification-resource';

@Service()
export class NotificationAssembler {
  static toEntityFromResource(resource: NotificationResource): Notification {
    const validType = Object.values(NotificationType).includes(resource.type as NotificationType)
      ? resource.type as NotificationType
      : resource.is_alert
        ? NotificationType.SENSOR_ALERT
        : NotificationType.SYSTEM_INFO;

    return new Notification(
      resource.id,
      resource.profile_id,
      resource.title,
      resource.message,
      resource.is_read,
      resource.is_alert,
      validType,
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
      type: entity.type as string,
      field_id: entity.fieldId,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
