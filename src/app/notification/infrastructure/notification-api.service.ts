import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../domain/model/notification.entity';
import { NotificationAssembler } from './notification.assembler';
import { NotificationResource } from './notification-resource';

const NOTIFICATIONS_ENDPOINT = environment.notificationsEndpoint;
const SORT_FIELD = 'created_at';
const SORT_DIRECTION = 'desc';

@Service()
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.cultivatechBaseApi}${NOTIFICATIONS_ENDPOINT}`;

  getByProfile(profileId: number): Observable<Notification[]> {
    const params = new HttpParams()
      .set('profile_id', profileId)
      .set('_sort', SORT_FIELD)
      .set('_order', SORT_DIRECTION);

    return this.http.get<NotificationResource[]>(this.resourceUrl, { params }).pipe(
      map((resources) => resources.map(NotificationAssembler.toEntityFromResource)),
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
