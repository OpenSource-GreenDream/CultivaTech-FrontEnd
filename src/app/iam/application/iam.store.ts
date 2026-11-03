import {inject, Service, signal} from '@angular/core';
import {IamApi} from '../infrastructure/iam-api';
import {User} from '../domain/model/user.entity';
import {SignUpRequest} from '../infrastructure/sign-up.request';
import {map, Observable, tap} from 'rxjs';
import {UserAssembler} from '../infrastructure/user.assembler';
import {SignInRequest} from '../infrastructure/sign-in.request';
import {AuthService} from './auth.service';
import {IAM_ERROR_CODES} from '../domain/model/iam.constants';

/**
 * Application service store for the IAM Bounded Context
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class IamStore {
  private readonly iamApi = inject(IamApi);
  private readonly authService = inject(AuthService);

  readonly user = signal<User | null>(this.authService.currentUser());

  constructor() {
    this.authService.registerCleanup(() => this.clearSession());
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
