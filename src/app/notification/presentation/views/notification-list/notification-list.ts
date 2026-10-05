import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { catchError, of, switchMap } from 'rxjs';
import { AuthService } from '../../../../iam/application/auth.service';
import { IamStore } from '../../../../iam/application/iam.store';
import { Notification } from '../../../domain/model/notification.entity';
import { NotificationType } from '../../../domain/model/notification-type.enum';
import { NotificationApiService } from '../../../infrastructure/notification-api.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-notification-list',
  imports: [MatButtonModule, MatListModule, DatePipe],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css',
})
export class NotificationList implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly iamStore = inject(IamStore);
  private readonly notificationApi = inject(NotificationApiService);

  readonly notifications = signal<Notification[]>([]);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly showAlertsOnly = signal(false);
  readonly showHistoryOnly = signal(false);
  readonly selectedNotification = signal<Notification | null>(null);
  readonly visibleNotifications = computed(() => {
    const notifications = this.notifications();
    if (this.showAlertsOnly()) {
      return notifications.filter((notification) => notification.type === NotificationType.SENSOR_ALERT);
    }
    if (this.showHistoryOnly()) {
      return notifications.filter((notification) => notification.isRead);
    }
    return notifications.filter((notification) => !notification.isRead);
  });

  ngOnInit(): void {
    const user = this.authService.currentUser() ?? this.iamStore.user();
    if (user === null) {
      this.hasError.set(true);
      return;
    }

    this.isLoading.set(true);
    this.notificationApi.getProfileIdByUser(user.id).pipe(
      switchMap((profileId) => {
        if (profileId === null) {
          return of(null);
        }
        return this.notificationApi.getByProfile(profileId);
      }),
      catchError(() => {
        this.hasError.set(true);
        return of(null);
      }),
    ).subscribe((result) => {
      if (result !== null) {
        this.notifications.set(result);
        // Show alert modal for first unread critical alert
        const firstCriticalAlert = result.find(n => n.isAlert && !n.isRead);
        if (firstCriticalAlert) {
          setTimeout(() => this.openAlertModal(firstCriticalAlert), 500);
        }
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

  openAlertModal(notification: Notification): void {
    this.selectedNotification.set(notification);
  }

  closeAlertModal(): void {
    this.selectedNotification.set(null);
  }

  acceptAlert(): void {
    const notification = this.selectedNotification();
    if (notification && !notification.isRead) {
      this.markAsRead(notification);
    }
    this.closeAlertModal();
  }

  showHistory(): void {
    this.showAlertsOnly.set(false);
    this.showHistoryOnly.set(true);
  }

  showRecent(): void {
    this.showAlertsOnly.set(false);
    this.showHistoryOnly.set(false);
  }

  viewDetails(notification: Notification): void {
    this.openAlertModal(notification);
  }
}
