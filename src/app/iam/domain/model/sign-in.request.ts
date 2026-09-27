/**
 * Request Payload to authenticate user
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export interface SignInRequest{
  email_address: string;
  password_hash: string;
}
