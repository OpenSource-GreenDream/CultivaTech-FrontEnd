import {computed, inject, Service, signal} from '@angular/core';
import {AuthService} from '../../iam/application/auth.service';
import {ProfileApi} from '../infrastructure/profile-api';
import {Profile} from '../domain/model/profile.entity';
import {map, Observable, of} from 'rxjs';
import {ProfileAssembler} from '../infrastructure/profile.assembler';

/**
 * Anti-Corruption Layer (ACL) / Shared Context Service
 * Exposes profile information to other Bounded Contexts without coupling them to IAM.
 * Acts as the single source of truth for the active user's Profile.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class ProfileContextService {
  private readonly profileApi = inject(ProfileApi);
  private readonly authStore = inject(AuthService);

  public readonly currentProfile = signal<Profile | null>(null);
  public readonly currentProfileId = computed<number | null>(() => this.currentProfile()?.id ?? null);

  constructor() {
    this.authStore.registerCleanup(() => this.clearProfile());
  }

  setProfile(profile: Profile | null): void {
    this.currentProfile.set(profile);
  }

  clearProfile(): void {
    this.currentProfile.set(null);
  }

  /**
   * Resolves the profile owned by the authenticated user.
   * Returns `null` only when the API explicitly confirms there is no profile.
   * Transport and server errors are propagated so callers can distinguish
   * an empty dataset from a failed request.
   */
  fetchCurrentProfile(): Observable<Profile | null> {
    const currentUser = this.authStore.currentUser();

    if (!currentUser || !currentUser.id) {
      this.clearProfile();
      return of(null);
    }

    const cached = this.currentProfile();
    if (cached && cached.userId === currentUser.id) {
      return of(cached);
    }

    return this.profileApi.getProfileByUserId(currentUser.id).pipe(
      map((resources) => {
        const list = Array.isArray(resources) ? resources : (resources ? [resources] : []);
        const resource = list.find((item) => Number(item.user_id) === Number(currentUser.id)) ?? null;

        if (!resource) {
          this.clearProfile();
          return null;
        }

        const profileEntity = ProfileAssembler.toEntityFromResource(resource);
        this.setProfile(profileEntity);
        return profileEntity;
      }),
    );
  }
}
