import {inject, Service, signal} from '@angular/core';
import {IamApi} from '../infrastructure/iam-api';
import {User} from '../domain/model/user.entity';
import {SignUp} from '../domain/model/sign-up.model';
import {SignIn} from '../domain/model/sign-in.model';
import {catchError, map, Observable, of, tap} from 'rxjs';

import {SignInResponse} from '../infrastructure/sign-in.response';
import {AuthService} from './auth.service';
import {IAM_ERROR_CODES} from '../domain/model/iam.constants';
import {Role} from '../domain/model/role.entity';
import {RoleApi} from '../infrastructure/role-api';

@Service()
export class IamStore {
  private readonly iamApi = inject(IamApi);
  private readonly roleApi = inject(RoleApi);
  private readonly authService = inject(AuthService);

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

  signUp(request: SignUp): Observable<User> {
    return this.iamApi.signUp(request).pipe(
      tap((user) => {
        this.user.set(user);
      }),
    );
  }

  signIn(request: SignIn): Observable<SignInResponse> {
    return this.iamApi.signIn(request).pipe(
      tap((response) => this.authService.establishSession(response, request.email)),
    );
  }

  clearSession(): void {
    this.user.set(null);
  }
}
