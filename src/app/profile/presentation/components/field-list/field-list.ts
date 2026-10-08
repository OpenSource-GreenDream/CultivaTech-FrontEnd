import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {Field} from '../../../domain/model/field.entity';
import {ProfileStore} from '../../../application/profile.store';
import {ProfileContextService} from '../../../application/profile-context.service';
import {CreateFieldRequest} from '../../../domain/model/create-field.request';
import {FormsModule} from '@angular/forms';
import {DecimalPipe} from '@angular/common';

/**
 * TODO: DELETE THIS METHOD WHEN INTEGRATING WITH THE REAL BACKEND!!!
 * The ID generation are mock implementations for JSON Server / Frontend prototyping.
 * REMOVE this manual ID assignment when integrating with the real Spring Boot / Express backend,
 * as the database will automatically generate unique IDs.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
function generateMockFieldId(): number {
  return Math.floor(100000 + Math.random() * 900000);
}

@Component({
  imports: [
    FormsModule,
    DecimalPipe
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

    // TODO: DELETE MOCK WHEN INTEGRATING BACKEND!!!
    const requestPayload: Omit<CreateFieldRequest, 'profile_id'> & { id?: number } = {
      id: generateMockFieldId(),
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
