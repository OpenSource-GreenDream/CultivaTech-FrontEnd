import {CreateFieldRequest} from '../infrastructure/create-field.request';
import {UpdateFieldRequest} from '../infrastructure/update-field.request';
import {map, Observable, of, tap, throwError} from 'rxjs';
import {Field} from '../domain/model/field.entity';
import {FieldAssembler} from '../infrastructure/field.assembler';
import {inject, Service, signal} from '@angular/core';
import {ProfileApi} from '../infrastructure/profile-api';
import {AuthService} from '../../iam/application/auth.service';
import {Profile} from '../domain/model/profile.entity';
import {ProfileAssembler} from '../infrastructure/profile.assembler';
import {CreateProfileRequest} from '../infrastructure/create-profile.request';
import {ProfileContextService} from './profile-context.service';
import {NotificationEventService} from '../../notification/application/notification-event.service';

/**
 * Application service store for the Profile Bounded Context.
 * Synchronized with ProfileContextService as the single source of truth.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
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

  /**
   * Fetches profile associated with the currently authenticated user
   */
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

  /**
   * Creates a new Profile for the current user and updates reactive state in both store and context
   */
  createProfile(request: Omit<CreateProfileRequest, 'user_id'>): Observable<Profile> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return throwError(() => new Error('User is not authenticated'));
    }

    const payload: CreateProfileRequest = {
      ...request,
      user_id: currentUser.id
    };

    return this.profileApi.createProfile(payload).pipe(
      map(resource => ProfileAssembler.toEntityFromResource(resource)),
      tap(profile => {
        this.profileContext.setProfile(profile);
        this.notificationEvents.profileCreated(profile);
      })
    );
  }

  /**
   * Fetches all fields belonging to the active profile
   */
  loadFieldsForCurrentProfile(): Observable<Field[]> {
    const profileId = this.profileContext.currentProfileId();

    if (!profileId) {
      this.fields.set([]);
      return of([]);
    }

    return this.profileApi.getFieldsByProfileId(profileId).pipe(
      map((resources) =>
        resources
          .filter(res => res.profile_id === profileId)
          .map(res => FieldAssembler.toEntityFromResource(res))
      ),
      tap((fields) => {
        this.fields.set(fields);
      })
    );
  }

  /**
   * Creates a new Field under the current active profile
   */
  createField(request: Omit<CreateFieldRequest, 'profile_id'>): Observable<Field> {
    const profile = this.currentProfile();
    if (!profile) {
      return throwError(() => new Error('No active profile loaded to add a field'));
    }

    const payload: CreateFieldRequest = {
      ...request,
      profile_id: profile.id
    };

    return this.profileApi.createField(payload).pipe(
      map(resource => FieldAssembler.toEntityFromResource(resource)),
      tap(newField => {
        this.fields.update(currentFields => [...currentFields, newField]);
        this.notificationEvents.fieldCreated(newField);
      })
    );
  }

  /**
   * Updates an existing Field under the current active profile
   */
  updateField(fieldId: number, request: Omit<UpdateFieldRequest, 'profile_id'>): Observable<Field> {
    const profile = this.currentProfile();
    if (!profile) {
      return throwError(() => new Error('No active profile loaded to update a field'));
    }

    const payload: UpdateFieldRequest = {
      ...request,
      profile_id: profile.id
    };

    return this.profileApi.updateField(fieldId, payload).pipe(
      map(resource => FieldAssembler.toEntityFromResource(resource)),
      tap(updatedField => {
        this.fields.update(currentFields =>
          currentFields.map(field => (field.id === updatedField.id ? updatedField : field))
        );
        this.notificationEvents.fieldUpdated(updatedField);
      })
    );
  }
}
