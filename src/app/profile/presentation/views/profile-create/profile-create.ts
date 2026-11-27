import {Component, inject, OnInit, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {ProfileStore} from '../../../application/profile.store';
import {ProfileContextService} from '../../../application/profile-context.service';
import {AuthService} from '../../../../iam/application/auth.service';
import {isProfileComplete} from '../../../domain/model/profile.entity';
import {
  nonBlankValidator,
  trimmedMinLengthValidator,
} from '../../../../shared/domain/validators/form.validators';

@Component({
  selector: 'app-profile-create',
  imports: [
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './profile-create.html',
  styleUrl: './profile-create.css'
})
export class ProfileCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileStore = inject(ProfileStore);
  private profileContext = inject(ProfileContextService);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal(false);

  readonly isAgricultural = this.authService.hasRole('FARMER') || this.authService.hasRole('ADMIN');

  readonly profileForm: FormGroup = this.fb.group({
    fundoName: ['', [nonBlankValidator, trimmedMinLengthValidator(2)]],
    contactPhone: ['', [nonBlankValidator, Validators.pattern(/^\+?[0-9\s-]{7,15}$/)]],
    moistureThreshold: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
    tempThreshold: [null, [Validators.required, Validators.min(-10), Validators.max(60)]]
  });

  ngOnInit(): void {
    if (!this.isAgricultural) {
      this.profileForm.get('moistureThreshold')?.clearValidators();
      this.profileForm.get('tempThreshold')?.clearValidators();
      this.profileForm.get('moistureThreshold')?.updateValueAndValidity();
      this.profileForm.get('tempThreshold')?.updateValueAndValidity();
      this.profileForm.patchValue({
        moistureThreshold: 0,
        tempThreshold: 0,
      });
    } else {
      this.profileForm.patchValue({
        fundoName: '',
        moistureThreshold: null,
        tempThreshold: null,
      });
    }

    this.profileContext.fetchCurrentProfile().subscribe({
      next: (existingProfile) => {
        if (existingProfile && isProfileComplete(existingProfile, this.authService.currentUserRoles() as readonly string[])) {
          this.router.navigate(['/profile']);
        } else if (existingProfile) {
          this.profileForm.patchValue({
            fundoName: existingProfile.fundoName === 'Default Fundo' ? '' : existingProfile.fundoName,
            contactPhone: existingProfile.contactPhone === '+51000000000' ? '' : existingProfile.contactPhone,
            moistureThreshold: existingProfile.moistureThreshold,
            tempThreshold: existingProfile.temperatureThreshold,
          });
        }
      },
      error: () => {
        this.errorMessage.set('profile.create.error-load');
      }
    });
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const { fundoName, contactPhone, moistureThreshold, tempThreshold } = this.profileForm.value;

    this.isSubmitting.set(true);
    this.profileStore.completeProfile(String(contactPhone).trim(), {
      fundoName: String(fundoName).trim(),
      moistureThreshold: Number(moistureThreshold),
      temperatureThreshold: Number(tempThreshold),
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(true);
        this.profileStore.setFeedback('profile.create.success');
        this.router.navigate(['/profile']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('profile.create.error-submit');
      }
    });
  }
}
