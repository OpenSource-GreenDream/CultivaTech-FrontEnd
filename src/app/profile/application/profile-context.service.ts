import {computed, inject, Service, signal} from '@angular/core';
import {AuthService} from '../../iam/application/auth.service';
import {ProfileApi} from '../infrastructure/profile-api';
import {Profile} from '../domain/model/profile.entity';
import {map, Observable, of} from 'rxjs';
import {ProfileAssembler} from '../infrastructure/profile.assembler';

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

  fetchCurrentProfile(): Observable<Profile | null> {
    const currentUser = this.authStore.currentUser();
    const userId = this.authStore.currentUserId();

    if (!currentUser || !userId) {
      this.clearProfile();
      return of(null);
    }

    const cached = this.currentProfile();
    if (cached && cached.userId === userId) {
      return of(cached);
    }

    return this.profileApi.getProfileByUserId(userId).pipe(
      map((resource) => {
        const profileEntity = ProfileAssembler.toEntityFromResource(resource);
        this.setProfile(profileEntity);
        return profileEntity;
      }),
    );
  }
}
