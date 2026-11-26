/**
 * HTTP request for user registration.
 */
export interface SignUpRequest {
  email: string;
  password: string;
  role?: string;
}
