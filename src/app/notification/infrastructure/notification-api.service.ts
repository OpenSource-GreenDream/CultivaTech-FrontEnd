import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationCreateRequest } from '../domain/model/notification-create.request';
import { Notification } from '../domain/model/notification.entity';
import { NotificationType } from '../domain/model/notification-type.enum';
import { NotificationAssembler } from './notification.assembler';
import { NotificationResource } from './notification-resource';

const NOTIFICATIONS_ENDPOINT = environment.notificationsEndpoint;
const PROFILES_ENDPOINT = environment.profilesEndpoint;
const SORT_FIELD = 'created_at';
const SORT_DIRECTION = 'desc';
const UNREAD_DEFAULT = false;

interface ProfileResource {
  id: number;
  user_id: number;
}

interface CollectionResource<T> {
  value: T[];
}

function unwrapCollection<T>(response: T[] | CollectionResource<T>): T[] {
  return Array.isArray(response) ? response : response.value;
}

@Service()
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.cultivatechBaseApi}${NOTIFICATIONS_ENDPOINT}`;
  private readonly profilesUrl = `${environment.cultivatechBaseApi}${PROFILES_ENDPOINT}`;

  getProfileIdByUser(userId: number): Observable<number | null> {
    // If userId is not in the valid range (1-5), use user_id 1
    const effectiveUserId = (userId < 1 || userId > 5) ? 1 : userId;

    const params = new HttpParams().set('user_id', effectiveUserId);

    return this.http.get<ProfileResource[] | CollectionResource<ProfileResource>>(this.profilesUrl, { params }).pipe(
      map((response) => {
        const existingProfile = unwrapCollection(response)[0];
        if (existingProfile) {
          return existingProfile.id;
        }
        // If no profile exists, return profile_id 1 as fallback
        console.warn(`No profile found for user_id ${effectiveUserId}, using profile_id 1`);
        return 1;
      }),
    );
  }

  getByProfile(profileId: number): Observable<Notification[]> {
    const params = new HttpParams()
      .set('profile_id', profileId)
      .set('_sort', SORT_FIELD)
      .set('_order', SORT_DIRECTION);

    return this.http.get<NotificationResource[] | CollectionResource<NotificationResource>>(this.resourceUrl, { params }).pipe(
      map((response) => unwrapCollection(response).map(NotificationAssembler.toEntityFromResource)),
    );
  }

  create(request: NotificationCreateRequest): Observable<Notification> {
    const now = new Date().toISOString();
    const payload = {
      profile_id: request.profileId,
      title: request.title,
      message: request.message,
      is_read: UNREAD_DEFAULT,
      is_alert: request.type === NotificationType.SENSOR_ALERT,
      type: request.type as string,
      field_id: request.fieldId,
      created_at: now,
      updated_at: now,
    };

    return this.http.post<NotificationResource>(this.resourceUrl, payload).pipe(
      map(NotificationAssembler.toEntityFromResource),
    );
  }

  markAsRead(notification: Notification): Observable<Notification> {
    const resourceUrl = `${this.resourceUrl}/${notification.id}`;
    const payload = {
      is_read: true,
      updated_at: new Date().toISOString(),
    };

    return this.http.patch<NotificationResource>(resourceUrl, payload).pipe(
      map(NotificationAssembler.toEntityFromResource),
    );
  }
}
