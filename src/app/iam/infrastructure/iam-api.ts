import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {SignUpRequest} from './sign-up.request';
import {Observable} from 'rxjs';
import {UserResource} from './user-response';
import {SignInRequest} from './sign-in.request';

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
   * @param request credential to register user.
   */
  signUp(request: SignUpRequest): Observable<UserResource>{
    // This change when backend already
    const roleDefinitions: Record<string, { id: number; name: string; description: string }> = {
      agricultor: { id: 1, name: 'agricultor', description: 'Rol para agricultores encargados de fundos y monitoreo IoT' },
      proveedor: { id: 2, name: 'proveedor', description: 'Rol para proveedores de hardware y equipos agrícolas' },
      clienteb2b: { id: 3, name: 'clienteb2b', description: 'Rol para clientes B2B de comercio mayorista' },
      administrador: { id: 4, name: 'administrador', description: 'Rol para la administración general del sistema CultivaTech' }
    };

    const selectedRole = roleDefinitions[request.role] || roleDefinitions['agricultor'];

    const payload = {
      email_address: request.email_address,
      password_hash: request.password_hash,
      roles: [selectedRole],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return this.http.post<UserResource>(this.baseUrl, payload);
  }

  /**
   * Method to authenticated user using email and password.
   * @param request credential to sign in
   */
  signIn(request: SignInRequest): Observable<UserResource[]>{
    return this.http.get<UserResource[]>(
      `${this.baseUrl}?emailAddress=${request.email_address}
                          &password_hash=${request.password_hash}`
    )
  }
}
