import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {ProfileResource} from './profile.response';
import {CreateProfileRequest} from '../domain/model/create-profile.request';
import {FieldResource} from './field-response';
import {CreateFieldRequest} from '../domain/model/create-field.request';
import {FieldAssembler} from './field.assembler';

/**
 * Service to consume Fake API for Profile and Field operations.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class ProfileApi {
  private http = inject(HttpClient);
  private profilesUrl = `${environment.cultivatechBaseApi}/profiles`;
  private fieldsUrl = `${environment.cultivatechBaseApi}/fields`;

  getProfileByUserId(userId: number): Observable<ProfileResource[]> {
    return this.http.get<ProfileResource[]>(`${this.profilesUrl}?user_id=${userId}`);
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
    return this.http.get<FieldResource[]>(`${this.fieldsUrl}?profile_id=${profileId}`);
  }

  createField(request: CreateFieldRequest): Observable<FieldResource> {
    const payload = {
      ...request,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return this.http.post<FieldResource>(this.fieldsUrl, payload);
  }
}
