import { NotificationType } from '../domain/model/notification-type.enum';

export interface NotificationResource {
  id: number;
  profile_id: number;
  title: string;
  message: string;
  is_read: boolean;
  is_alert: boolean;
  type: NotificationType;
  field_id: number | null;
  created_at: string;
  updated_at: string;
}
