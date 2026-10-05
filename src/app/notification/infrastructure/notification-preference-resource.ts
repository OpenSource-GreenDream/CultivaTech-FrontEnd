export interface NotificationPreferenceResource {
  id: number;
  profile_id: number;
  type: string;
  field_id: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}
