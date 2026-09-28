import { NotificationPreference } from '../domain/model/notification-preference.entity';
import { NotificationType } from '../domain/model/notification-type.enum';
import { NotificationPreferenceAssembler } from './notification-preference.assembler';
import { NotificationPreferenceResource } from './notification-preference-resource';

describe('NotificationPreferenceAssembler', () => {
  it('maps preference resource fields to camelCase entity properties', () => {
    const resource: NotificationPreferenceResource = {
      id: 4,
      profile_id: 12,
      type: NotificationType.SENSOR_ALERT,
      field_id: 7,
      enabled: false,
      created_at: '2026-09-22T00:00:00Z',
      updated_at: '2026-09-22T01:00:00Z',
    };

    const entity = NotificationPreferenceAssembler.toEntityFromResource(resource);

    expect(entity).toEqual(new NotificationPreference(
      4,
      12,
      NotificationType.SENSOR_ALERT,
      7,
      false,
      resource.created_at,
      resource.updated_at,
    ));
  });
});
