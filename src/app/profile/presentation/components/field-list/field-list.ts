import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {Field} from '../../../domain/model/field.entity';
import {ProfileStore} from '../../../application/profile.store';
import {ProfileContextService} from '../../../application/profile-context.service';
import {CreateFieldRequest} from '../../../infrastructure/create-field.request';
import {FormsModule} from '@angular/forms';
import {DecimalPipe} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  imports: [
    FormsModule,
    DecimalPipe,
    TranslatePipe
  ],
  selector: 'app-field-list',
  styleUrl: './field-list.css',
  templateUrl: './field-list.html',
})
export class FieldList {
  @Input() fields: Field[] = [];
  @Output() fieldCreated = new EventEmitter<void>();

  private profileStore = inject(ProfileStore);
  private profileContext = inject(ProfileContextService);

  showForm = false;
  isSubmitting = false;

  newField = {
    name: '',
    sizeM2: 0,
    soilType: '',
    latitude: 0,
    longitude: 0
  };

  submitField(): void {
    if (!this.newField.name || !this.newField.soilType) return;

    const currentProfileId = this.profileContext.currentProfileId();
    if (!currentProfileId) {
      console.error('No se puede crear un lote sin un perfil activo asociado.');
      return;
    }

    this.isSubmitting = true;

    const requestPayload: Omit<CreateFieldRequest, 'profile_id'> = {
      name: this.newField.name,
      size_m2: this.newField.sizeM2,
      soil_type: this.newField.soilType,
      latitude: this.newField.latitude,
      longitude: this.newField.longitude
    };

    this.profileStore.createField(requestPayload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showForm = false;
        this.resetForm();
        this.fieldCreated.emit();
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  private resetForm(): void {
    this.newField = {
      name: '',
      sizeM2: 0,
      soilType: '',
      latitude: 0,
      longitude: 0
    };
  }
}
