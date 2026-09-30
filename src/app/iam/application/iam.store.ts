import {inject, resource, Service, signal} from '@angular/core';
import {IamApi} from '../infrastructure/iam-api';
import {User} from '../domain/model/user.entity';
import {SignUpRequest} from '../domain/model/sign-up.request';
import {map, Observable, tap} from 'rxjs';
import {UserAssembler} from '../infrastructure/user.assembler';
import {SignInRequest} from '../domain/model/sign-in.request';
import {AuthService} from './auth.service';

/**
 * Application service store for the IAM Bounded Context
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class IamStore {
  private iamApi = inject(IamApi);
  private authService = inject(AuthService);

  readonly user = signal<User | null>(null);

  /**
   * Register user
   * @param request credential to register
   */
  signUp(request: SignUpRequest) {
    return this.iamApi.signUp(request).pipe(
      map(resource=>UserAssembler.toEntityFromResource(resource)),
      tap(user=> {
        this.user.set(user)
        this.authService.currentUser.set(user);
      })
    );
  }

  /**
   * Authenticates user and updated the reactive store state
   * @param request credential to login
   */
  signIn(request: SignInRequest): Observable<User>{
    return this.iamApi.signIn(request).pipe(
      map(resource=>{
        if (!resource || resource.length === 0){
          throw new Error('Credential invalid');
        }
        return UserAssembler.toEntityFromResource(resource[0]);
      }),
      tap(user=>{
        this.user.set(user);
        this.authService.currentUser.set(user);
      })
    );
  }
}
