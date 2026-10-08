/**
 * Request Payload to create a new Profile
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export interface CreateProfileRequest{
  user_id: number;
  fundo_name: string;
  contact_phone: string;
  moisture_threshold: number;
  temp_threshold: number;
}
