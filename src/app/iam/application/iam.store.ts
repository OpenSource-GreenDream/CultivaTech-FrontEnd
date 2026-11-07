import {inject, Service, signal} from '@angular/core';
import {IamApi} from '../infrastructure/iam-api';
import {User} from '../domain/model/user.entity';
import {SignUpRequest} from '../infrastructure/sign-up.request';
import {catchError, map, Observable, of, tap} from 'rxjs';
import {UserAssembler} from '../infrastructure/user.assembler';
import {SignInRequest} from '../infrastructure/sign-in.request';
import {AuthService} from './auth.service';
import {IAM_ERROR_CODES} from '../domain/model/iam.constants';
import {Role} from '../domain/model/role.entity';
import {RoleApi} from '../infrastructure/role-api';
import {NotificationEventService} from '../../notification/application/notification-event.service';

/**
 * Application service store for the IAM Bounded Context
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class IamStore {
  private readonly iamApi = inject(IamApi);
  private readonly roleApi = inject(RoleApi);
  private readonly authService = inject(AuthService);
  private readonly notificationEvents = inject(NotificationEventService);

  readonly user = signal<User | null>(this.authService.currentUser());
  private readonly _roles = signal<Role[]>([]);
  readonly roles = this._roles.asReadonly();
  readonly rolesLoading = signal(false);
  readonly rolesError = signal(false);

  constructor() {
    this.authService.registerCleanup(() => {
      this.clearSession();
      this._roles.set([]);
      this.rolesLoading.set(false);
      this.rolesError.set(false);
    });
  }

  /**
   * Loads the backend role catalog. Results are cached for the session so the
   * sign-up form and role resolution share the same dynamic source.
   */
  loadRoles(): Observable<Role[]> {
    if (this._roles().length > 0) {
      return of(this._roles());
    }

    this.rolesLoading.set(true);
    this.rolesError.set(false);

    return this.roleApi.getRoles().pipe(
      tap((roles) => {
        this._roles.set(roles);
        this.rolesError.set(roles.length === 0);
        this.rolesLoading.set(false);
      }),
      catchError(() => {
        this.rolesLoading.set(false);
        this.rolesError.set(true);
        return of([]);
      }),
    );
  }

  /**
   * Register user
   * @param request credential to register
   */
  signUp(request: SignUpRequest): Observable<User> {
    return this.iamApi.signUp(request).pipe(
      map((resource) => UserAssembler.toEntityFromResource(resource)),
      tap((user) => {
        this.user.set(user);
        this.authService.setSession(user);
        this.notificationEvents.accountCreated(user.email_address);
      }),
    );
  }

  /**
   * Authenticates user via API layer response and updates reactive store state
   * @param request credential to login
   */
  signIn(request: SignInRequest): Observable<User> {
    return this.iamApi.signIn(request).pipe(
      map((resource) => {
        if (!resource || !resource.id) {
          throw new Error(IAM_ERROR_CODES.INVALID_CREDENTIALS);
        }
        return UserAssembler.toEntityFromResource(resource);
      }),
      tap((user) => {
        this.user.set(user);
        this.authService.setSession(user);
      }),
    );
  }

  /**
   * Resets the IAM store user signal and in-memory session state
   */
  clearSession(): void {
    this.user.set(null);
  }
}
