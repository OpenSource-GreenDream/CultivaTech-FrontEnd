import {inject, Service} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, map, Observable, throwError} from 'rxjs';
import {environment} from '../../../environments/environment';
import {UserResource} from './user-response';
import {IAM_ERROR_CODES} from '../domain/model/iam.constants';

/**
 * Internal representation used exclusively by the simulated authentication gateway.
 * The mock database still persists a credential column; it must never leak into
 * domain entities or presentation DTOs.
 */
interface MockUserRecord {
  id: number;
  email_address: string;
  password?: string;
  password_hash?: string;
  roles?: UserResource['roles'];
  created_at: string;
  updated_at: string;
}

/**
 * Simulated server-side authentication gateway.
 * Emulates the `POST /auth/login` contract while the public mock API has no auth backend.
 * Validation happens in the infrastructure layer so the application layer only consumes
 * the resulting authenticated user.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class SimulatedAuthGateway {
  private readonly http = inject(HttpClient);
  private readonly usersUrl = `${environment.cultivatechBaseApi}${environment.usersEndpoint}`;

  authenticate(email: string, password: string): Observable<UserResource> {
    const params = new HttpParams().set('email_address', email.trim().toLowerCase());

    return this.http.get<MockUserRecord[]>(this.usersUrl, { params }).pipe(
      map((records) => {
        const list = Array.isArray(records) ? records : [];
        const match = list.find(
          (record) => record.email_address?.trim().toLowerCase() === email.trim().toLowerCase(),
        );
        const storedCredential = match?.password_hash ?? match?.password ?? null;

        if (!match || storedCredential === null || storedCredential !== password) {
          throw new Error(IAM_ERROR_CODES.INVALID_CREDENTIALS);
        }

        return {
          id: match.id,
          email_address: match.email_address,
          roles: match.roles,
          created_at: match.created_at,
          updated_at: match.updated_at,
        } satisfies UserResource;
      }),
      catchError((error) => {
        if (error instanceof Error) {
          return throwError(() => error);
        }
        return throwError(() => new Error(IAM_ERROR_CODES.INVALID_CREDENTIALS));
      }),
    );
  }
}
