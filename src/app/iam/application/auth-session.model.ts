export interface AuthSession {
  readonly userId: number;
  readonly email: string;
  readonly accessToken: string;
  readonly tokenType: string;
  readonly expiresAt: number;
  readonly roles: readonly string[];
}
