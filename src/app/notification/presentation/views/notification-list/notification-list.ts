import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../../../iam/application/auth.service';
import { Notification } from '../../../domain/model/notification.entity';
import { NotificationStore } from '../../../application/notification.store';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-notification-list',
  imports: [DatePipe, TranslatePipe],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css',
})
export class NotificationList implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly notificationStore = inject(NotificationStore);
  private alertModalTimer: ReturnType<typeof setTimeout> | null = null;

  readonly notifications = this.notificationStore.notifications;
  readonly isLoading = this.notificationStore.loading;
  readonly hasError = this.notificationStore.hasError;
  readonly unreadCount = this.notificationStore.unreadCount;

  readonly totalNotifications = computed(() => this.notifications().length);
  readonly criticalAlerts = computed(() => this.notifications().filter((n) => n.isAlert).length);

  readonly showAlertsOnly = signal(false);
  readonly showHistoryOnly = signal(false);
  readonly selectedNotification = signal<Notification | null>(null);
  readonly visibleNotifications = computed(() => {
    const notifications = this.notifications();
    if (this.showAlertsOnly()) {
      return notifications.filter((notification) => notification.isAlert);
    }
    if (this.showHistoryOnly()) {
      return notifications.filter((notification) => notification.isRead);
    }
    return notifications;
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user === null) {
      return;
    }
    this.notificationStore.loadNotifications().pipe(catchError(() => of([]))).subscribe();
  }

  ngOnDestroy(): void {
    if (this.alertModalTimer) {
      clearTimeout(this.alertModalTimer);
      this.alertModalTimer = null;
    }
  }

  refresh(): void {
    this.notificationStore.loadNotifications().pipe(catchError(() => of([]))).subscribe();
  }

  markAsRead(notification: Notification): void {
    this.notificationStore.markAsRead(notification).pipe(catchError(() => of(notification))).subscribe();
  }

  delete(notification: Notification): void {
    this.notificationStore.delete(notification).pipe(catchError(() => of(void 0))).subscribe();
  }

  openAlertModal(notification: Notification): void {
    if (this.alertModalTimer) {
      clearTimeout(this.alertModalTimer);
      this.alertModalTimer = null;
    }
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

  setAlertFilter(enabled: boolean): void {
    this.showAlertsOnly.set(enabled);
  }

  viewDetails(notification: Notification): void {
    this.openAlertModal(notification);
  }
}