import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {SignUpRequest} from '../domain/model/sign-up.request';
import {Observable} from 'rxjs';
import {UserResource} from './user-response';

/**
 * Service to consumed Fake API to register.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class IamApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.cultivatechBaseApi}${environment.usersEndpoint}`;

  /**
   * Method to register user.
   * @param request request to register user.
   */
  signUp(request: SignUpRequest): Observable<UserResource>{
    const payload = {
      emailAddress: request.emailAddress,
      password_hash: request.password_hash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return this.http.post<UserResource>(this.baseUrl, payload);
  }
}
