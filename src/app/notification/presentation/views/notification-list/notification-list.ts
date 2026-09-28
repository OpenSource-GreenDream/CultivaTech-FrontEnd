import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { AuthService } from '../../../../iam/application/auth.service';
import { Notification } from '../../../domain/model/notification.entity';
import { NotificationType } from '../../../domain/model/notification-type.enum';
import { NotificationApiService } from '../../../infrastructure/notification-api.service';
import { NotificationPreferenceApiService } from '../../../infrastructure/notification-preference-api.service';
import { NotificationPreference } from '../../../domain/model/notification-preference.entity';

@Component({
  selector: 'app-notification-list',
  imports: [MatButtonModule, MatListModule, RouterLink, TranslatePipe],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css',
})
export class NotificationList implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notificationApi = inject(NotificationApiService);
  private readonly preferenceApi = inject(NotificationPreferenceApiService);

  readonly notifications = signal<Notification[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly showAlertsOnly = signal(false);
  readonly visibleNotifications = computed(() => {
    const notifications = this.notifications();
    return this.showAlertsOnly()
      ? notifications.filter((notification) => notification.type === NotificationType.SENSOR_ALERT)
      : notifications;
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user === null) {
      this.hasError.set(true);
      return;
    }

    this.isLoading.set(true);
    this.notificationApi.getProfileIdByUser(user.id).pipe(
      switchMap((profileId) => profileId === null
        ? of(null)
        : forkJoin({
          notifications: this.notificationApi.getByProfile(profileId),
          preferences: this.preferenceApi.getByProfile(profileId),
        })),
      catchError(() => {
        this.hasError.set(true);
        return of(null);
      }),
    ).subscribe((result) => {
      if (result !== null) {
        this.notifications.set(result.notifications.filter((notification) => {
          const scopedPreference = result.preferences.find((preference) =>
            preference.type === notification.type && preference.fieldId === notification.fieldId,
          );
          const globalPreference = result.preferences.find((preference) =>
            preference.type === notification.type && preference.fieldId === null,
          );
          return (scopedPreference ?? globalPreference)?.enabled ?? true;
        }));
      } else {
        this.hasError.set(true);
      }
      this.isLoading.set(false);
    });
  }

  setAlertFilter(enabled: boolean): void {
    this.showAlertsOnly.set(enabled);
  }

  markAsRead(notification: Notification): void {
    this.notificationApi.markAsRead(notification).subscribe({
      next: (updatedNotification) => {
        this.notifications.update((notifications) => notifications.map((current) =>
          current.id === updatedNotification.id ? updatedNotification : current,
        ));
      },
      error: () => this.hasError.set(true),
    });
  }
}
