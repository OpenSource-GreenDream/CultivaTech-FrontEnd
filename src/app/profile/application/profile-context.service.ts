import { inject, Service, signal} from '@angular/core';
import {AuthService} from '../../iam/application/auth.service';
import {ProfileApi} from '../infrastructure/profile-api';
import {Profile} from '../domain/model/profile.entity';
import {catchError, map, Observable, of, tap} from 'rxjs';
import {ProfileAssembler} from '../infrastructure/profile.assembler';

/**
 * Anti-Corruption Layer (ACL) / Shared Context Service
 * Exposes profile information to other Bounded Contexts without coupling them to IAM.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class ProfileContextService {
  private profileApi = inject(ProfileApi);
  private authStore = inject(AuthService);

  private currentProfileSignal = signal<Profile | null>(null);
  public currentProfile = this.currentProfileSignal.asReadonly();

  public currentProfileId = signal<number | null>(null);

  fetchCurrentProfile(): Observable<Profile | null> {
    const currentUser = this.authStore.currentUser();

    if (!currentUser || !currentUser.id) {
      this.currentProfileSignal.set(null);
      this.currentProfileId.set(null);
      return of(null);
    }

    return this.profileApi.getProfileByUserId(currentUser.id).pipe(
      map((resources) => {
        const resource = Array.isArray(resources) ? resources[0] : resources;

        if (!resource) {
          this.currentProfileSignal.set(null);
          this.currentProfileId.set(null);
          return null;
        }

        const profileEntity = ProfileAssembler.toEntityFromResource(resource);

        this.currentProfileSignal.set(profileEntity);
        this.currentProfileId.set(profileEntity.id);

        return profileEntity;
      }),
      catchError(() => {
        this.currentProfileSignal.set(null);
        this.currentProfileId.set(null);
        return of(null);
      })
    );
  }
}
