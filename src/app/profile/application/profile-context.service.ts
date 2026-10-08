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
    console.log('[ProfileContextService] currentUser en authStore:', currentUser);

    if (!currentUser || !currentUser.id) {
      console.warn('[ProfileContextService] No hay currentUser activo o falta el ID. Abortando petición HTTP.');
      this.currentProfileSignal.set(null);
      this.currentProfileId.set(null);
      return of(null);
    }

    console.log(`[ProfileContextService] Realizando petición HTTP para userId: ${currentUser.id}`);

    return this.profileApi.getProfileByUserId(currentUser.id).pipe(
      tap((rawResponse) => console.log('[ProfileContextService] Respuesta RAW de ProfileApi:', rawResponse)),
      map((resources) => {
        const resource = Array.isArray(resources) ? resources[0] : resources;

        if (!resource) {
          console.warn('[ProfileContextService] No se encontró ningún recurso de perfil en la respuesta.');
          this.currentProfileSignal.set(null);
          this.currentProfileId.set(null);
          return null;
        }

        const profileEntity = ProfileAssembler.toEntityFromResource(resource);
        console.log('[ProfileContextService] Entidad Profile mapeada con éxito:', profileEntity);

        this.currentProfileSignal.set(profileEntity);
        this.currentProfileId.set(profileEntity.id);

        return profileEntity;
      }),
      catchError((error) => {
        console.error('[ProfileContextService] Error en HTTP getProfileByUserId:', error);
        this.currentProfileSignal.set(null);
        this.currentProfileId.set(null);
        return of(null);
      })
    );
  }
}
