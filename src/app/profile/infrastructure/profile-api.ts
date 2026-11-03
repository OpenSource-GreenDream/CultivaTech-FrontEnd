import {inject, Service} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {ProfileResource} from './profile.response';
import {CreateProfileRequest} from './create-profile.request';
import {FieldResource} from './field-response';
import {CreateFieldRequest} from './create-field.request';
import {UpdateFieldRequest} from './update-field.request';

/**
 * Service to consume Fake API for Profile and Field operations.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class ProfileApi {
  private http = inject(HttpClient);
  private profilesUrl = `${environment.cultivatechBaseApi}${environment.profilesEndpoint}`;
  private fieldsUrl = `${environment.cultivatechBaseApi}${environment.fieldsEndpoint}`;

  getProfileByUserId(userId: number): Observable<ProfileResource[]> {
    const params = new HttpParams().set('user_id', userId.toString());
    return this.http.get<ProfileResource[]>(this.profilesUrl, { params });
  }

  createProfile(request: CreateProfileRequest): Observable<ProfileResource> {
    const payload = {
      ...request,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return this.http.post<ProfileResource>(this.profilesUrl, payload);
  }

  getFieldsByProfileId(profileId: number): Observable<FieldResource[]> {
    const params = new HttpParams().set('profile_id', profileId.toString());
    return this.http.get<FieldResource[]>(this.fieldsUrl, { params });
  }

  createField(request: CreateFieldRequest): Observable<FieldResource> {
    const payload = {
      ...request,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return this.http.post<FieldResource>(this.fieldsUrl, payload);
  }

  updateField(fieldId: number, request: UpdateFieldRequest): Observable<FieldResource> {
    const payload = {
      ...request,
      updated_at: new Date().toISOString()
    };
    return this.http.patch<FieldResource>(`${this.fieldsUrl}/${fieldId}`, payload);
  }
}
