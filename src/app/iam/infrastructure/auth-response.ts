import {UserResource} from './user-response';

/**
 * This is a response to authenticate a User to access to application.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export interface AuthResponse{
  token?: string;
  user: UserResource;
}
