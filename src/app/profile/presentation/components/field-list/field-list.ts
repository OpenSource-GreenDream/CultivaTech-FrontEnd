import {Component, computed, inject, input, output, signal} from '@angular/core';
import {Field} from '../../../domain/model/field.entity';
import {ProfileStore} from '../../../application/profile.store';
import {ProfileContextService} from '../../../application/profile-context.service';
import {CreateFieldRequest} from '../../../infrastructure/create-field.request';
import {AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import {DecimalPipe} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

function nonEmptyTextValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || String(value).trim().length === 0) {
    return { required: true };
  }
  return null;
}

function positiveAreaValidator(control: AbstractControl): ValidationErrors | null {
  const raw = control.value;
  if (raw === null || raw === undefined || String(raw).trim() === '') {
    return { required: true };
  }
  const num = Number(raw);
  if (Number.isNaN(num) || num <= 0) {
    return { positiveArea: true };
  }
  return null;
}

function coordinateValidator(min: number, max: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (raw === null || raw === undefined || String(raw).trim() === '') {
      return { required: true };
    }
    const num = Number(raw);
    if (Number.isNaN(num) || num < min || num > max) {
      return { range: true };
    }
    return null;
  };
}

@Component({
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    TranslatePipe
  ],
  selector: 'app-field-list',
  styleUrl: './field-list.css',
  templateUrl: './field-list.html',
})
export class FieldList {
  readonly fields = input<Field[]>([]);
  readonly fieldCreated = output<void>();

  private fb = inject(FormBuilder);
  private profileStore = inject(ProfileStore);
  private profileContext = inject(ProfileContextService);

  readonly showForm = signal(false);
  readonly isSubmitting = signal(false);
  readonly editingFieldId = signal<number | null>(null);
  readonly isEditing = computed(() => this.editingFieldId() !== null);
  readonly feedbackMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly fieldForm: FormGroup = this.fb.group({
    name: ['', [nonEmptyTextValidator]],
    sizeM2: [null, [positiveAreaValidator]],
    soilType: ['', [nonEmptyTextValidator]],
    latitude: [null, [coordinateValidator(-90, 90)]],
    longitude: [null, [coordinateValidator(-180, 180)]]
  });

  toggleForm(): void {
    this.errorMessage.set(null);
    if (this.showForm()) {
      this.cancelForm();
    } else {
      this.editingFieldId.set(null);
      this.resetForm();
      this.showForm.set(true);
    }
  }

  startEdit(field: Field): void {
    this.feedbackMessage.set(null);
    this.errorMessage.set(null);
    this.editingFieldId.set(field.id);
    this.fieldForm.reset({
      name: field.name,
      sizeM2: field.sizeM2,
      soilType: field.soilType,
      latitude: field.latitude,
      longitude: field.longitude
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingFieldId.set(null);
    this.errorMessage.set(null);
    this.resetForm();
  }

  submitField(): void {
    this.feedbackMessage.set(null);
    this.errorMessage.set(null);

    if (this.fieldForm.invalid) {
      this.fieldForm.markAllAsTouched();
      this.errorMessage.set('fields.form.error-validation');
      return;
    }

    const currentProfileId = this.profileContext.currentProfileId();
    if (!currentProfileId) {
      this.errorMessage.set('fields.form.error-no-profile');
      return;
    }

    const { name, sizeM2, soilType, latitude, longitude } = this.fieldForm.value;
    const requestPayload: Omit<CreateFieldRequest, 'profile_id'> = {
      name: String(name).trim(),
      size_m2: Number(sizeM2),
      soil_type: String(soilType).trim(),
      latitude: Number(latitude),
      longitude: Number(longitude)
    };

    this.isSubmitting.set(true);
    const editingId = this.editingFieldId();

    const operation$ = editingId !== null
      ? this.profileStore.updateField(editingId, requestPayload)
      : this.profileStore.createField(requestPayload);

    operation$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.feedbackMessage.set(
          editingId !== null ? 'fields.form.update-success' : 'fields.form.create-success'
        );
        this.cancelForm();
        this.fieldCreated.emit();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('fields.form.error-submit');
      }
    });
  }

  private resetForm(): void {
    this.fieldForm.reset({
      name: '',
      sizeM2: null,
      soilType: '',
      latitude: null,
      longitude: null
    });
  }
}
