import { NotificationType } from '../domain/model/notification-type.enum';

export interface NotificationPreferenceResource {
  id: number;
  profile_id: number;
  type: NotificationType;
  field_id: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}
