import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationCreateRequest } from '../domain/model/notification-create.request';
import { Notification } from '../domain/model/notification.entity';
import { NotificationAssembler } from './notification.assembler';
import { NotificationResource } from './notification-resource';

const NOTIFICATIONS_ENDPOINT = environment.notificationsEndpoint;

@Service()
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.cultivatechBaseApi}${NOTIFICATIONS_ENDPOINT}`;

  getAll(profileId?: number): Observable<Notification[]> {
    let params = new HttpParams();
    if (profileId !== undefined && profileId !== null) {
      params = params.set('profileId', profileId);
    }
    return this.http.get<NotificationResource[]>(this.resourceUrl, { params }).pipe(
      map((response) => (response ?? []).map(NotificationAssembler.toEntityFromResource)),
    );
  }

  getByProfile(profileId: number): Observable<Notification[]> {
    return this.getAll(profileId);
  }

  getById(id: number): Observable<Notification> {
    return this.http.get<NotificationResource>(`${this.resourceUrl}/${id}`).pipe(
      map(NotificationAssembler.toEntityFromResource),
    );
  }

  create(request: NotificationCreateRequest): Observable<Notification> {
    const payload = {
      profileId: request.profileId,
      title: request.title,
      message: request.message,
      isAlert: request.isAlert,
    };
    return this.http.post<NotificationResource>(this.resourceUrl, payload).pipe(
      map(NotificationAssembler.toEntityFromResource),
    );
  }

  update(id: number, title: string, message: string, isAlert: boolean): Observable<Notification> {
    const payload = { title, message, isAlert };
    return this.http.put<NotificationResource>(`${this.resourceUrl}/${id}`, payload).pipe(
      map(NotificationAssembler.toEntityFromResource),
    );
  }

  markAsRead(notification: Notification): Observable<Notification> {
    return this.http.patch<NotificationResource>(`${this.resourceUrl}/${notification.id}/read`, {}).pipe(
      map(NotificationAssembler.toEntityFromResource),
    );
  }

  markAsReadById(id: number): Observable<Notification> {
    return this.http.patch<NotificationResource>(`${this.resourceUrl}/${id}/read`, {}).pipe(
      map(NotificationAssembler.toEntityFromResource),
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${id}`);
  }
}