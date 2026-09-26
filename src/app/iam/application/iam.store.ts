import {inject, resource, Service, signal} from '@angular/core';
import {IamApi} from '../infrastructure/iam-api';
import {User} from '../domain/model/user.entity';
import {SignUpRequest} from '../domain/model/sign-up.request';
import {map, tap} from 'rxjs';
import {UserAssembler} from '../infrastructure/user.assembler';

/**
 * Application service store for the IAM Bounded Context
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class IamStore {
  private iamApi = inject(IamApi);

  readonly user = signal<User | null>(null);

  signUp(request: SignUpRequest) {
    return this.iamApi.signUp(request).pipe(
      map(resource=>UserAssembler.toEntityFromResource(resource)),
      tap(user=>this.user.set(user))
    );
  }
}
