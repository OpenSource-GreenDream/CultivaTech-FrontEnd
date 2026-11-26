/**
 * HTTP response for a successful sign-in.
 */
export interface UserSummaryResponse {
  id: number;
  email: string;
  roles: string[];
  active: boolean;
}

export interface SignInResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSummaryResponse;
}
