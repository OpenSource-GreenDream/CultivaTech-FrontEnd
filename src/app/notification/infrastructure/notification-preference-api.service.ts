import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationPreference } from '../domain/model/notification-preference.entity';
import { NotificationPreferenceAssembler } from './notification-preference.assembler';
import { NotificationPreferenceResource } from './notification-preference-resource';

const PREFERENCES_ENDPOINT = environment.notificationPreferencesEndpoint;

@Service()
export class NotificationPreferenceApiService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.cultivatechBaseApi}${PREFERENCES_ENDPOINT}`;

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
}
