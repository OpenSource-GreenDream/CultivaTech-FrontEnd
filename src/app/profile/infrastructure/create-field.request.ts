/**
 * Request Payload to create a new Field
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export interface CreateFieldRequest {
  profile_id: number;
  name: string;
  size_m2: number;
  soil_type: string;
  latitude: number;
  longitude: number;
}
