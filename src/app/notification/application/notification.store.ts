import { computed, inject, Service, signal } from '@angular/core';
import { AuthService } from '../../iam/application/auth.service';
import { ProfileContextService } from '../../profile/application/profile-context.service';
import { Notification } from '../domain/model/notification.entity';
import { NotificationApiService } from '../infrastructure/notification-api.service';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

@Service()
export class NotificationStore {
  private readonly authService = inject(AuthService);
  private readonly profileContext = inject(ProfileContextService);
  private readonly notificationApi = inject(NotificationApiService);

  private readonly _notifications = signal<Notification[]>([]);
  readonly loading = signal<boolean>(false);
  readonly hasError = signal<boolean>(false);

  readonly notifications = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this._notifications();
  });

  readonly unreadCount = computed(() =>
    this._notifications().filter((notification) => !notification.isRead).length,
  );

  constructor() {
    this.authService.registerCleanup(() => this.clearState());
  }

  clearState(): void {
    this._notifications.set([]);
    this.loading.set(false);
    this.hasError.set(false);
  }

  loadNotifications(): Observable<Notification[]> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this._notifications.set([]);
      return of([]);
    }

    this.loading.set(true);
    this.hasError.set(false);

    return this.profileContext.fetchCurrentProfile().pipe(
      switchMap((profile) => {
        if (!profile) {
          this._notifications.set([]);
          this.loading.set(false);
          return of([]);
        }
        return this.notificationApi.getByProfile(profile.id).pipe(
          tap((notifications) => {
            this._notifications.set(notifications);
            this.loading.set(false);
          }),
        );
      }),
      catchError((error) => {
        this.loading.set(false);
        this.hasError.set(true);
        return throwError(() => error);
      }),
    );
  }

  refresh(): Observable<Notification[]> {
    return this.loadNotifications();
  }

  createNotification(profileId: number, title: string, message: string, isAlert: boolean): Observable<Notification> {
    return this.notificationApi.create({ profileId, title, message, isAlert }).pipe(
      map((notification) => notification),
      tap((notification) => {
        this._notifications.update((current) => [notification, ...current]);
      }),
    );
  }

  markAsRead(notification: Notification): Observable<Notification> {
    return this.notificationApi.markAsRead(notification).pipe(
      tap((updated) => {
        this._notifications.update((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      }),
      catchError((error) => {
        this.hasError.set(true);
        return throwError(() => error);
      }),
    );
  }

  delete(notification: Notification): Observable<void> {
    return this.notificationApi.delete(notification.id).pipe(
      tap(() => {
        this._notifications.update((current) =>
          current.filter((item) => item.id !== notification.id),
        );
      }),
      catchError((error) => {
        this.hasError.set(true);
        return throwError(() => error);
      }),
    );
  }
}