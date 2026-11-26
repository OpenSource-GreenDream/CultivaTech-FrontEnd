import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable, throwError} from 'rxjs';
import {map} from 'rxjs/operators';
import {SignIn} from '../domain/model/sign-in.model';
import {SignUp} from '../domain/model/sign-up.model';
import {User} from '../domain/model/user.entity';
import {SignInRequest} from './sign-in.request';
import {SignUpRequest} from './sign-up.request';
import {SignInResponse} from './sign-in.response';
import {UserResponse} from './user-response';
import {UserAssembler} from './user.assembler';

/**
 * Infrastructure service for IAM authentication endpoints.
 */
@Service()
export class IamApi {
  private readonly http = inject(HttpClient);
  private readonly signInUrl = `${environment.cultivatechBaseApi}${environment.signInEndpoint}`;
  private readonly signUpUrl = `${environment.cultivatechBaseApi}${environment.signUpEndpoint}`;

  signIn(signIn: SignIn): Observable<SignInResponse> {
    const request: SignInRequest = {
      email: signIn.email,
      password: signIn.password,
    };

    return this.http.post<SignInResponse>(this.signInUrl, request);
  }

  signUp(signUp: SignUp): Observable<User> {
    const normalizedRole = signUp.role.trim().toUpperCase();
    if (!['FARMER', 'CUSTOMER', 'SUPPLIER'].includes(normalizedRole)) {
      return throwError(() => new Error('IAM sign-up role is not supported by the current backend contract'));
    }

    const request: SignUpRequest = {
      email: signUp.email,
      password: signUp.password,
      role: normalizedRole,
    };

    return this.http.post<UserResponse>(this.signUpUrl, request).pipe(
      map((response) => UserAssembler.toEntityFromResource(response)),
    );
  }
}
