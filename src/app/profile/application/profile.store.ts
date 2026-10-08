import {CreateFieldRequest} from '../domain/model/create-field.request';
import {catchError, map, Observable, of, tap, throwError} from 'rxjs';
import {Field} from '../domain/model/field.entity';
import {FieldAssembler} from '../infrastructure/field.assembler';
import {inject, Service, signal} from '@angular/core';
import {ProfileApi} from '../infrastructure/profile-api';
import {AuthService} from '../../iam/application/auth.service';
import {Profile} from '../domain/model/profile.entity';
import {ProfileAssembler} from '../infrastructure/profile.assembler';
import {CreateProfileRequest} from '../domain/model/create-profile.request';
import {ProfileContextService} from './profile-context.service';

/**
 * Application service store for the Profile Bounded Context.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class ProfileStore {
  private profileApi = inject(ProfileApi);
  private authService = inject(AuthService);
  private profileContext = inject(ProfileContextService);

  readonly currentProfile = signal<Profile | null>(null);
  readonly fields = signal<Field[]>([]);

  /**
   * Fetches profile associated with the currently authenticated user
   */
  loadProfileByCurrentUser(): Observable<Profile> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return throwError(() => new Error('User is not authenticated'));
    }

    return this.profileApi.getProfileByUserId(currentUser.id).pipe(
      map(resources => {
        if (!resources || resources.length === 0) {
          throw new Error('Profile not found for the user');
        }
        return ProfileAssembler.toEntityFromResource(resources[0]);
      }),
      tap(profile => {
        this.currentProfile.set(profile);
      })
    );
  }

  /**
   * Creates a new Profile for the current user and updates reactive state
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
        this.currentProfile.set(profile);
      })
    );
  }

  /**
   * Fetches all fields belonging to the active profile
   */
  loadFieldsForCurrentProfile(): Observable<Field[]> {
    const profileId = this.profileContext.currentProfileId();
    console.log('[ProfileStore] loadFieldsForCurrentProfile invocado con profileId:', profileId);

    if (!profileId) {
      console.warn('[ProfileStore] Sin profileId activo para cargar campos.');
      this.fields.set([]);
      return of([]);
    }

    return this.profileApi.getFieldsByProfileId(profileId).pipe(
      tap((resources) => console.log('[ProfileStore] Respuesta RAW de fields:', resources)),
      map((resources) => resources.map(res => FieldAssembler.toEntityFromResource(res))),
      tap((fields) => {
        console.log('[ProfileStore] Entidades Field mapeadas:', fields);
        this.fields.set(fields);
      }),
      catchError((err) => {
        console.error('[ProfileStore] Error al consultar campos:', err);
        this.fields.set([]);
        return of([]);
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
      })
    );
  }
}
