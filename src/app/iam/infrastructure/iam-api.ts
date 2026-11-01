import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {SignUpRequest} from './sign-up.request';
import {catchError, map, Observable, of, switchMap} from 'rxjs';
import {UserResource} from './user-response';
import {SignInRequest} from './sign-in.request';
import {ROLE_DEFINITIONS, USER_ROLES, UserRoleType} from '../domain/model/iam.constants';
import {SimulatedAuthGateway} from './simulated-auth.gateway';

interface AuthLoginResponse {
  user?: UserResource;
}

/**
 * Service to consume API for authentication and user registration.
 * Credentials are never sent as URL parameters.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class IamApi {
  private readonly http = inject(HttpClient);
  private readonly simulatedAuth = inject(SimulatedAuthGateway);
  private readonly usersUrl = `${environment.cultivatechBaseApi}${environment.usersEndpoint}`;
  private readonly loginUrl = `${environment.cultivatechBaseApi}${environment.signInEndpoint}`;
  private readonly userRolesUrl = `${environment.cultivatechBaseApi}${environment.userRolesEndpoint}`;

  /**
   * Method to register user.
   * @param request credential to register user.
   */
  signUp(request: SignUpRequest): Observable<UserResource> {
    const normalizedRoleKey = (request.role ?? '').trim().toUpperCase() as UserRoleType;
    const selectedRole =
      ROLE_DEFINITIONS[normalizedRoleKey] ?? ROLE_DEFINITIONS[USER_ROLES.AGRICULTOR];
    const now = new Date().toISOString();

    const payload = {
      email_address: (request.email_address ?? '').trim(),
      password: request.password,
      roles: [selectedRole],
      created_at: now,
      updated_at: now,
    };

    return this.http.post<UserResource>(this.usersUrl, payload).pipe(
      map((user) => this.sanitizeUserResource(user)),
      switchMap((user) =>
        this.http
          .post(this.userRolesUrl, {
            user_id: user.id,
            role_id: selectedRole.id,
            created_at: now,
          })
          .pipe(
            catchError(() => of(void 0)),
            map(() => user),
          ),
      ),
    );
  }

  /**
   * Authenticate via `POST /auth/login` with body `{ email, password }`.
   * Falls back to the simulated server-side gateway when the mock backend
   * does not expose the authentication route.
   * @param request credential to sign in
   */
  signIn(request: SignInRequest): Observable<UserResource> {
    const email = (request.email ?? '').trim();
    const payload = { email, password: request.password };

    return this.http.post<UserResource | AuthLoginResponse>(this.loginUrl, payload).pipe(
      map((response) => this.extractUser(response)),
      catchError(() => this.simulatedAuth.authenticate(email, request.password)),
    );
  }

  private extractUser(response: UserResource | AuthLoginResponse): UserResource {
    const rawUser =
      response && typeof response === 'object' && 'user' in response && response.user
        ? response.user
        : (response as UserResource);
    return this.sanitizeUserResource(rawUser);
  }

  private sanitizeUserResource(resource: UserResource): UserResource {
    return {
      id: resource.id,
      email_address: resource.email_address,
      roles: resource.roles,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    };
  }
}
