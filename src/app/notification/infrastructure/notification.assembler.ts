import { Notification } from '../domain/model/notification.entity';
import { NotificationResource } from './notification-resource';

export class NotificationAssembler {
  static toEntityFromResource(resource: NotificationResource): Notification {
    return new Notification(
      resource.id,
      resource.profileId,
      resource.title,
      resource.message,
      resource.isRead,
      resource.isAlert,
      resource.createdAt,
      resource.updatedAt,
    );
  }

  static toResourceFromEntity(entity: Notification): NotificationResource {
    return {
      id: entity.id,
      profileId: entity.profileId,
      title: entity.title,
      message: entity.message,
      isRead: entity.isRead,
      isAlert: entity.isAlert,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}