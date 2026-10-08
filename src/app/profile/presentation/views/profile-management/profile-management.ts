import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {ProfileStore} from '../../../application/profile.store';
import {ProfileContextService} from '../../../application/profile-context.service';
import {ProfileInfo} from '../../components/profile-info/profile-info';
import {FieldList} from '../../components/field-list/field-list';

@Component({
  imports: [
    ProfileInfo,
    FieldList
  ],
  selector: 'app-profile-management',
  styleUrl: './profile-management.css',
  templateUrl: './profile-management.html',
})
export class ProfileManagementComponent implements OnInit {
  protected profileStore = inject(ProfileStore);
  private profileContext = inject(ProfileContextService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;

  ngOnInit(): void {
    console.log('[ProfileManagementComponent] ngOnInit iniciado.');
    this.isLoading = true;

    this.profileContext.fetchCurrentProfile().subscribe({
      next: (profile) => {
        console.log('[ProfileManagementComponent] fetchCurrentProfile result:', profile);
        if (profile) {
          this.profileStore.currentProfile.set(profile);
          this.loadFields();
        } else {
          console.warn('[ProfileManagementComponent] Sin perfil. Finalizando estado de carga.');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('[ProfileManagementComponent] Error en fetchCurrentProfile:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadFields(): void {
    console.log('[ProfileManagementComponent] Cargando campos del fundo...');
    this.profileStore.loadFieldsForCurrentProfile().subscribe({
      next: (fields) => {
        console.log('[ProfileManagementComponent] Campos cargados exitosamente:', fields);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ProfileManagementComponent] Error al cargar campos:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFieldCreated(): void {
    console.log('[ProfileManagementComponent] Nuevo campo creado. Recargando lista de campos...');
    this.loadFields();
  }
}
