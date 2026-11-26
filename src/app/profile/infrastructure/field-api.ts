import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {FieldResource} from './field-response';
import {UpdateFieldRequest} from './update-field.request';
import {Observable, of} from 'rxjs';

@Service()
export class FieldApi {
  private readonly http = inject(HttpClient);
  private readonly fieldsUrl = `${environment.cultivatechBaseApi}${environment.fieldsEndpoint}`;
  private readonly profilesUrl = `${environment.cultivatechBaseApi}${environment.profilesEndpoint}`;

  getFields(profileId?: number): Observable<FieldResource[]> {
    if (profileId === undefined || profileId === null) {
      return of([]);
    }
    return this.http.get<FieldResource[]>(`${this.profilesUrl}/${profileId}/fields`);
  }

  getFieldById(id: number): Observable<FieldResource> {
    return this.http.get<FieldResource>(`${this.fieldsUrl}/${id}`);
  }

  updateField(id: number, request: UpdateFieldRequest): Observable<FieldResource> {
    return this.http.put<FieldResource>(`${this.fieldsUrl}/${id}`, request);
  }

  deleteField(id: number): Observable<void> {
    return this.http.delete<void>(`${this.fieldsUrl}/${id}`);
  }
}
