/**
 * Domain model representing the intent to register a user.
 *
 * The role represents the business role selected by the user. The current
 * backend sign-up contract only accepts email and password, so the effective
 * role assignment remains a backend responsibility.
 */
export interface SignUp {
  email: string;
  password: string;
  role: string;
}
