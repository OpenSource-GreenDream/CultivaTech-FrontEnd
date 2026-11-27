export interface NotificationResource {
  id: number;
  profileId: number;
  title: string;
  message: string;
  isRead: boolean;
  isAlert: boolean;
  createdAt: string;
  updatedAt: string;
}