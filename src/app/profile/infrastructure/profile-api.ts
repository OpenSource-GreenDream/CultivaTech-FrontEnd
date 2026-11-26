import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {ProfileResource} from './profile.response';
import {CreateProfileRequest} from './create-profile.request';
import {FieldResource} from './field-response';
import {CreateFieldRequest} from './create-field.request';
import {UpdateFieldRequest} from './update-field.request';

@Service()
export class ProfileApi {
  private readonly http = inject(HttpClient);
  private readonly usersUrl = `${environment.cultivatechBaseApi}${environment.usersEndpoint}`;
  private readonly profilesUrl = `${environment.cultivatechBaseApi}${environment.profilesEndpoint}`;
  private readonly fieldsUrl = `${environment.cultivatechBaseApi}${environment.fieldsEndpoint}`;

  getProfileByUserId(userId: number): Observable<ProfileResource> {
    return this.http.get<ProfileResource>(`${this.usersUrl}/${userId}/profile`);
  }

  updateProfile(userId: number, request: CreateProfileRequest): Observable<ProfileResource> {
    return this.http.put<ProfileResource>(`${this.usersUrl}/${userId}/profile`, request);
  }

  createProfile(userId: number, request: CreateProfileRequest): Observable<ProfileResource> {
    return this.http.post<ProfileResource>(`${this.usersUrl}/${userId}/profile`, request);
  }

  getFieldsByProfileId(profileId: number): Observable<FieldResource[]> {
    return this.http.get<FieldResource[]>(`${this.profilesUrl}/${profileId}/fields`);
  }

  getFieldById(fieldId: number): Observable<FieldResource> {
    return this.http.get<FieldResource>(`${this.fieldsUrl}/${fieldId}`);
  }

  createField(profileId: number, request: CreateFieldRequest): Observable<FieldResource> {
    return this.http.post<FieldResource>(`${this.profilesUrl}/${profileId}/fields`, request);
  }

  updateField(fieldId: number, request: UpdateFieldRequest): Observable<FieldResource> {
    return this.http.put<FieldResource>(`${this.fieldsUrl}/${fieldId}`, request);
  }

  deleteField(fieldId: number): Observable<void> {
    return this.http.delete<void>(`${this.fieldsUrl}/${fieldId}`);
  }
}
