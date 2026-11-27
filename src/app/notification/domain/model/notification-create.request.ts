export interface NotificationCreateRequest {
  profileId: number;
  title: string;
  message: string;
  isAlert: boolean;
}