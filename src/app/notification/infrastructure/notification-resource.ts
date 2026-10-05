export interface NotificationResource {
  id: number;
  profile_id: number;
  title: string;
  message: string;
  is_read: boolean;
  is_alert: boolean;
  type: string;
  field_id: number | null;
  created_at: string;
  updated_at: string;
}
