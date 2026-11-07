import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {SignUpRequest} from './sign-up.request';
import {catchError, map, Observable, of, switchMap, throwError} from 'rxjs';
import {RoleResource, UserResource} from './user-response';
import {SignInRequest} from './sign-in.request';
import {IAM_ERROR_CODES} from '../domain/model/iam.constants';
import {SimulatedAuthGateway} from './simulated-auth.gateway';
import {RoleApi} from './role-api';
import {Role} from '../domain/model/role.entity';

interface AuthLoginResponse {
  user?: UserResource;
}

/**
 * Service to consume API for authentication and user registration.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class IamApi {
  private readonly http = inject(HttpClient);
  private readonly simulatedAuth = inject(SimulatedAuthGateway);
  private readonly roleApi = inject(RoleApi);
  private readonly usersUrl = `${environment.cultivatechBaseApi}${environment.usersEndpoint}`;
  private readonly loginUrl = `${environment.cultivatechBaseApi}${environment.signInEndpoint}`;
  private readonly userRolesUrl = `${environment.cultivatechBaseApi}${environment.userRolesEndpoint}`;

  /**
   * Method to register user.
   * @param request credential to register user.
   */
  signUp(request: SignUpRequest): Observable<UserResource> {
    const requestedRole = (request.role ?? '').trim();

    return this.roleApi.resolveRole(requestedRole).pipe(
      switchMap((selectedRole) => {
        if (!selectedRole) {
          return throwError(() => new Error(IAM_ERROR_CODES.ROLE_NOT_AVAILABLE));
        }

        const now = new Date().toISOString();
        const roleResource = this.toRoleResource(selectedRole);
        const payload = {
          email_address: (request.email_address ?? '').trim(),
          password: request.password,
          roles: [roleResource],
          created_at: now,
          updated_at: now,
        };

        return this.http.post<UserResource>(this.usersUrl, payload).pipe(
          map((user) => this.sanitizeUserResource(user)),
          switchMap((user) => {
            if (selectedRole.id <= 0) {
              return of(user);
            }

            return this.http
              .post(this.userRolesUrl, {
                user_id: user.id,
                role_id: selectedRole.id,
                created_at: now,
              })
              .pipe(
                catchError(() => of(void 0)),
                map(() => user),
              );
          }),
        );
      }),
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

  private toRoleResource(role: Role): RoleResource {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
    };
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
