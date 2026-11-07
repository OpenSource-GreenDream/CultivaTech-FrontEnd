import { NotificationType } from './notification-type.enum';

export interface NotificationCreateRequest {
  profileId: number;
  title: string;
  message: string;
  type: NotificationType;
  fieldId: number | null;
  /** Original occurrence time, used to preserve the event trail when queued. */
  createdAt?: string;
}
