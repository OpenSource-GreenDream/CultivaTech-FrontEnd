import { Component, inject, OnInit, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { AuthService } from '../../../../iam/application/auth.service';
import { NotificationPreference } from '../../../domain/model/notification-preference.entity';
import { NotificationType } from '../../../domain/model/notification-type.enum';
import { NotificationApiService } from '../../../infrastructure/notification-api.service';
import {
  NotificationFieldOption,
  NotificationPreferenceApiService,
} from '../../../infrastructure/notification-preference-api.service';

@Component({
  selector: 'app-notification-preferences',
  imports: [MatFormFieldModule, MatSelectModule, MatSlideToggleModule, RouterLink, TranslatePipe],
  templateUrl: './notification-preferences.html',
  styleUrl: './notification-preferences.css',
})
export class NotificationPreferences implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notificationApi = inject(NotificationApiService);
  private readonly preferenceApi = inject(NotificationPreferenceApiService);

  readonly notificationTypes = Object.values(NotificationType);
  readonly preferences = signal<NotificationPreference[]>([]);
  readonly fields = signal<NotificationFieldOption[]>([]);
  readonly selectedFieldId = signal<number | null>(null);
  readonly profileId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);
  readonly savingTypes = signal<NotificationType[]>([]);

  ngOnInit(): void {
    const user = this.authService.currentUser();
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
        this.profileId.set(profileId);
        return forkJoin({
          preferences: this.preferenceApi.getByProfile(profileId),
          fields: this.preferenceApi.getFieldsByProfile(profileId),
        });
      }),
      catchError(() => {
        this.hasError.set(true);
        return of(null);
      }),
    ).subscribe((result) => {
      if (result === null) {
        this.hasError.set(true);
      } else {
        this.preferences.set(result.preferences);
        this.fields.set(result.fields);
      }
      this.isLoading.set(false);
    });
  }

  isEnabled(type: NotificationType): boolean {
    return this.findApplicablePreference(type)?.enabled ?? true;
  }

  isSaving(type: NotificationType): boolean {
    return this.savingTypes().includes(type);
  }

  selectField(fieldId: number | null): void {
    this.selectedFieldId.set(fieldId);
  }

  setEnabled(type: NotificationType, enabled: boolean): void {
    const profileId = this.profileId();
    if (profileId === null) {
      this.hasError.set(true);
      return;
    }

    this.savingTypes.update((types) => [...types, type]);
    const preference = this.findExactPreference(type);
    const request = preference === undefined
      ? this.preferenceApi.create(profileId, type, this.selectedFieldId(), enabled)
      : this.preferenceApi.update(new NotificationPreference(
        preference.id,
        preference.profileId,
        preference.type,
        preference.fieldId,
        enabled,
        preference.createdAt,
        preference.updatedAt,
      ));

    request.subscribe({
      next: (updatedPreference) => {
        this.preferences.update((preferences) => {
          const existingIndex = preferences.findIndex((current) => current.id === updatedPreference.id);
          if (existingIndex === -1) {
            return [...preferences, updatedPreference];
          }
          return preferences.map((current) => current.id === updatedPreference.id ? updatedPreference : current);
        });
        this.clearSaving(type);
      },
      error: () => {
        this.hasError.set(true);
        this.clearSaving(type);
      },
    });
  }

  onToggle(type: NotificationType, event: MatSlideToggleChange): void {
    this.setEnabled(type, event.checked);
  }

  private findExactPreference(type: NotificationType): NotificationPreference | undefined {
    return this.preferences().find((preference) =>
      preference.type === type && preference.fieldId === this.selectedFieldId(),
    );
  }

  private findApplicablePreference(type: NotificationType): NotificationPreference | undefined {
    const exactPreference = this.findExactPreference(type);
    if (exactPreference !== undefined || this.selectedFieldId() === null) {
      return exactPreference;
    }
    return this.preferences().find((preference) =>
      preference.type === type && preference.fieldId === null,
    );
  }

  private clearSaving(type: NotificationType): void {
    this.savingTypes.update((types) => types.filter((savingType) => savingType !== type));
  }
}
