import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationPreference } from '../domain/model/notification-preference.entity';
import { NotificationPreferenceAssembler } from './notification-preference.assembler';
import { NotificationPreferenceResource } from './notification-preference-resource';

const PREFERENCES_ENDPOINT = environment.notificationPreferencesEndpoint;
const FIELDS_ENDPOINT = environment.fieldsEndpoint;

export interface NotificationFieldOption {
  id: number;
  name: string;
}

@Service()
export class NotificationPreferenceApiService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.cultivatechBaseApi}${PREFERENCES_ENDPOINT}`;
  private readonly fieldsUrl = `${environment.cultivatechBaseApi}${FIELDS_ENDPOINT}`;

  getFieldsByProfile(profileId: number): Observable<NotificationFieldOption[]> {
    const params = new HttpParams().set('profile_id', profileId);

    return this.http.get<NotificationFieldOption[]>(this.fieldsUrl, { params });
  }

  getByProfile(profileId: number): Observable<NotificationPreference[]> {
    const params = new HttpParams().set('profile_id', profileId);

    return this.http.get<NotificationPreferenceResource[]>(this.resourceUrl, { params }).pipe(
      map((resources) => resources.map(NotificationPreferenceAssembler.toEntityFromResource)),
    );
  }

  update(preference: NotificationPreference): Observable<NotificationPreference> {
    const resourceUrl = `${this.resourceUrl}/${preference.id}`;
    const payload = {
      enabled: preference.enabled,
      field_id: preference.fieldId,
      updated_at: new Date().toISOString(),
    };

    return this.http.patch<NotificationPreferenceResource>(resourceUrl, payload).pipe(
      map(NotificationPreferenceAssembler.toEntityFromResource),
    );
  }

  create(
    profileId: number,
    type: NotificationPreference['type'],
    fieldId: number | null,
    enabled: boolean,
  ): Observable<NotificationPreference> {
    const now = new Date().toISOString();
    const payload = {
      profile_id: profileId,
      type,
      field_id: fieldId,
      enabled,
      created_at: now,
      updated_at: now,
    };

    return this.http.post<NotificationPreferenceResource>(this.resourceUrl, payload).pipe(
      map(NotificationPreferenceAssembler.toEntityFromResource),
    );
  }
}
