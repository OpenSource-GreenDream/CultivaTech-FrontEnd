import {CreateFieldRequest} from '../infrastructure/create-field.request';
import {UpdateFieldRequest} from '../infrastructure/update-field.request';
import {map, Observable, of, tap, throwError} from 'rxjs';
import {Field} from '../domain/model/field.entity';
import {FieldAssembler} from '../infrastructure/field.assembler';
import {inject, Service, signal} from '@angular/core';
import {ProfileApi} from '../infrastructure/profile-api';
import {AuthService} from '../../iam/application/auth.service';
import {Profile} from '../domain/model/profile.entity';
import {COMMERCIAL_PROFILE_DEFAULTS} from '../domain/model/profile.constants';
import {ProfileAssembler} from '../infrastructure/profile.assembler';
import {CreateProfileRequest} from '../infrastructure/create-profile.request';
import {ProfileContextService} from './profile-context.service';
import {NotificationEventService} from '../../notification/application/notification-event.service';

@Service()
export class ProfileStore {
  private profileApi = inject(ProfileApi);
  private authService = inject(AuthService);
  private profileContext = inject(ProfileContextService);
  private notificationEvents = inject(NotificationEventService);

  readonly currentProfile = this.profileContext.currentProfile;
  readonly fields = signal<Field[]>([]);
  readonly feedbackMessage = signal<string | null>(null);

  constructor() {
    this.authService.registerCleanup(() => {
      this.profileContext.clearProfile();
      this.fields.set([]);
      this.feedbackMessage.set(null);
    });
  }

  setFeedback(message: string | null): void {
    this.feedbackMessage.set(message);
  }

  clearFeedback(): void {
    this.feedbackMessage.set(null);
  }

  loadProfileByCurrentUser(): Observable<Profile> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return throwError(() => new Error('User is not authenticated'));
    }

    return this.profileContext.fetchCurrentProfile().pipe(
      map(profile => {
        if (!profile) {
          throw new Error('Profile not found for the user');
        }
        return profile;
      })
    );
  }

  updateProfile(request: CreateProfileRequest): Observable<Profile> {
    const userId = this.authService.currentUserId();
    if (userId === null) {
      return throwError(() => new Error('User is not authenticated'));
    }

    return this.profileApi.updateProfile(userId, request).pipe(
      map(resource => ProfileAssembler.toEntityFromResource(resource)),
      tap(profile => {
        this.profileContext.setProfile(profile);
        this.notificationEvents.profileCreated(profile);
      })
    );
  }

  createProfile(request: CreateProfileRequest): Observable<Profile> {
    return this.updateProfile(request);
  }

  completeProfile(contactPhone: string, agricultural?: {
    fundoName: string;
    moistureThreshold: number;
    temperatureThreshold: number;
  }): Observable<Profile> {
    const userId = this.authService.currentUserId();
    if (userId === null) {
      return throwError(() => new Error('User is not authenticated'));
    }

    const isFarmer = this.authService.hasRole('FARMER');
    const request: CreateProfileRequest = isFarmer
      ? {
          fundoName: agricultural?.fundoName ?? '',
          contactPhone,
          moistureThreshold: agricultural?.moistureThreshold ?? 0,
          temperatureThreshold: agricultural?.temperatureThreshold ?? 0,
        }
      : {
          fundoName: COMMERCIAL_PROFILE_DEFAULTS.fundoName,
          contactPhone,
          moistureThreshold: COMMERCIAL_PROFILE_DEFAULTS.moistureThreshold,
          temperatureThreshold: COMMERCIAL_PROFILE_DEFAULTS.temperatureThreshold,
        };

    return this.profileApi.updateProfile(userId, request).pipe(
      map(resource => ProfileAssembler.toEntityFromResource(resource)),
      tap(profile => {
        this.profileContext.setProfile(profile);
        this.notificationEvents.profileCreated(profile);
      })
    );
  }

  loadFieldsForCurrentProfile(): Observable<Field[]> {
    const profileId = this.profileContext.currentProfileId();

    if (!profileId) {
      this.fields.set([]);
      return of([]);
    }

    return this.profileApi.getFieldsByProfileId(profileId).pipe(
      map((resources) =>
        resources.map(res => FieldAssembler.toEntityFromResource(res))
      ),
      tap((fields) => {
        this.fields.set(fields);
      })
    );
  }

  createField(request: CreateFieldRequest): Observable<Field> {
    const profile = this.currentProfile();
    if (!profile) {
      return throwError(() => new Error('No active profile loaded to add a field'));
    }

    return this.profileApi.createField(profile.id, request).pipe(
      map(resource => FieldAssembler.toEntityFromResource(resource)),
      tap(newField => {
        this.fields.update(currentFields => [...currentFields, newField]);
        this.notificationEvents.fieldCreated(newField);
      })
    );
  }

  updateField(fieldId: number, request: UpdateFieldRequest): Observable<Field> {
    return this.profileApi.updateField(fieldId, request).pipe(
      map(resource => FieldAssembler.toEntityFromResource(resource)),
      tap(updatedField => {
        this.fields.update(currentFields =>
          currentFields.map(field => (field.id === updatedField.id ? updatedField : field))
        );
        this.notificationEvents.fieldUpdated(updatedField);
      })
    );
  }

  deleteField(fieldId: number): Observable<void> {
    return this.profileApi.deleteField(fieldId).pipe(
      tap(() => {
        this.fields.update(currentFields => currentFields.filter(field => field.id !== fieldId));
      })
    );
  }
}
