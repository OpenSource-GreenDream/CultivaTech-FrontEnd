import { NotificationType } from '../domain/model/notification-type.enum';
import { NotificationAssembler } from './notification.assembler';
import { NotificationResource } from './notification-resource';

describe('NotificationAssembler', () => {
  it('maps API snake_case fields to the notification entity', () => {
    const resource: NotificationResource = {
      id: 3,
      profile_id: 8,
      title: 'Sensor alert',
      message: 'Soil moisture is below the threshold.',
      is_read: false,
      is_alert: true,
      type: 'SENSOR_ALERT',
      field_id: 2,
      created_at: '2026-09-21T06:01:10Z',
      updated_at: '2026-09-21T06:01:10Z',
    };

    const entity = NotificationAssembler.toEntityFromResource(resource);

    expect(entity.profileId).toBe(resource.profile_id);
    expect(entity.isRead).toBe(resource.is_read);
    expect(entity.isAlert).toBe(resource.is_alert);
    expect(entity.fieldId).toBe(resource.field_id);
    expect(entity.createdAt).toBe(resource.created_at);
    expect(entity.type).toBe(NotificationType.SENSOR_ALERT);
  });

  it('handles invalid notification type by defaulting to SYSTEM_INFO', () => {
    const resource: NotificationResource = {
      id: 3,
      profile_id: 8,
      title: 'Invalid type',
      message: 'This has an invalid type.',
      is_read: false,
      is_alert: false,
      type: 'INVALID_TYPE',
      field_id: null,
      created_at: '2026-09-21T06:01:10Z',
      updated_at: '2026-09-21T06:01:10Z',
    };

    const entity = NotificationAssembler.toEntityFromResource(resource);

    expect(entity.type).toBe(NotificationType.SYSTEM_INFO);
  });
});
