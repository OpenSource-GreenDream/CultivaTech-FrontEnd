/**
 * This is a request to register a new User.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export interface SignUpRequest{
  email_address: string;
  password_hash: string
  role: string;
}
