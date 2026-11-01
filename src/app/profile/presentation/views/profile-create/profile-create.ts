import {Component, inject, OnInit, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {ProfileStore} from '../../../application/profile.store';
import {ProfileContextService} from '../../../application/profile-context.service';

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
  private router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal(false);

  readonly profileForm: FormGroup = this.fb.group({
    fundoName: ['', [Validators.required, Validators.minLength(2)]],
    contactPhone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-]{7,15}$/)]],
    moistureThreshold: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
    tempThreshold: [null, [Validators.required, Validators.min(-10), Validators.max(60)]]
  });

  ngOnInit(): void {
    this.profileContext.fetchCurrentProfile().subscribe({
      next: (existingProfile) => {
        if (existingProfile) {
          this.router.navigate(['/profile']);
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
    this.profileStore.createProfile({
      fundo_name: String(fundoName).trim(),
      contact_phone: String(contactPhone).trim(),
      moisture_threshold: Number(moistureThreshold),
      temp_threshold: Number(tempThreshold)
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
