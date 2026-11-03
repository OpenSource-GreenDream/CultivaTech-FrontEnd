/**
 * Request Payload to update an existing Field
 */
export interface UpdateFieldRequest {
  profile_id: number;
  name: string;
  size_m2: number;
  soil_type: string;
  latitude: number;
  longitude: number;
}
