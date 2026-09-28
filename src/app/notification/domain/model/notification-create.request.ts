import { NotificationType } from './notification-type.enum';

export interface NotificationCreateRequest {
  profileId: number;
  title: string;
  message: string;
  type: NotificationType;
  fieldId: number | null;
}
