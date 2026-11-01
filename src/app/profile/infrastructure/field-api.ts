import {inject, Service} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {FieldResource} from './field-response';
import {UpdateFieldRequest} from './update-field.request';
import {Observable} from 'rxjs';

@Service()
export class FieldApi{
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.cultivatechBaseApi}${environment.fieldsEndpoint}`;

  getFields(profileId?: number): Observable<FieldResource[]> {
    if (profileId !== undefined && profileId !== null) {
      const params = new HttpParams().set('profile_id', profileId.toString());
      return this.http.get<FieldResource[]>(this.resourceUrl, { params });
    }
    return this.http.get<FieldResource[]>(this.resourceUrl);
  }

  getFieldById(id: number): Observable<FieldResource> {
    return this.http.get<FieldResource>(`${this.resourceUrl}/${id}`);
  }

  updateField(id: number, request: UpdateFieldRequest): Observable<FieldResource> {
    return this.http.patch<FieldResource>(`${this.resourceUrl}/${id}`, {
      ...request,
      updated_at: new Date().toISOString()
    });
  }
}
