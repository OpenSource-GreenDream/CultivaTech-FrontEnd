import {Component, computed, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {ProfileStore} from '../../../application/profile.store';
import {ProfileContextService} from '../../../application/profile-context.service';
import {AuthService} from '../../../../iam/application/auth.service';
import {canManageFields} from '../../../../shared/domain/access-policy';
import {CommunityApi} from '../../../../community/infrastructure/community-api';
import {CommunityProfileAssembler} from '../../../../community/infrastructure/community-profile.assembler';
import {ReviewAssembler} from '../../../../community/infrastructure/review.assembler';
import {CommunityProfile} from '../../../../community/domain/model/community-profile.entity';
import {Review} from '../../../../community/domain/model/review.entity';
import {ProfileInfo} from '../../components/profile-info/profile-info';
import {FieldList} from '../../components/field-list/field-list';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  imports: [
    FieldList,
    ReactiveFormsModule,
    DatePipe,
    TranslatePipe
  ],
  selector: 'app-profile-management',
  styleUrl: './profile-management.css',
  templateUrl: './profile-management.html',
})
export class ProfileManagementComponent implements OnInit, OnDestroy {
  protected profileStore = inject(ProfileStore);
  private profileContext = inject(ProfileContextService);
  private authService = inject(AuthService);
  private communityApi = inject(CommunityApi);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  readonly canManageFields = computed(() => canManageFields(this.authService.currentUserRoles()));
  readonly isAgricultural = computed(() => this.canManageFields());
  readonly currentUserRoles = computed(() => this.authService.currentUserRoles());

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isEditing = signal(false);
  readonly isSaving = signal(false);
  readonly communityProfile = signal<CommunityProfile | null>(null);
  readonly receivedReviews = signal<Review[]>([]);

  readonly editForm = this.fb.group({
    fundoName: ['', [Validators.required]],
    contactPhone: ['', [Validators.required]],
    moistureThreshold: [0],
    temperatureThreshold: [0],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.profileStore.clearFeedback();
  }

  private loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.profileContext.fetchCurrentProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.patchEditForm(profile);
          if (this.canManageFields()) {
            this.loadFields();
          } else {
            this.loadCommunityData(profile.id);
          }
        } else {
          this.isLoading.set(false);
          this.router.navigate(['/profile/create']);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('profile.management.load-error');
      }
    });
  }

  private loadFields(): void {
    this.profileStore.loadFieldsForCurrentProfile().subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('fields.load-error');
      }
    });
  }

  private patchEditForm(profile: any): void {
    this.editForm.patchValue({
      fundoName: profile.fundoName,
      contactPhone: profile.contactPhone,
      moistureThreshold: profile.moistureThreshold,
      temperatureThreshold: profile.temperatureThreshold,
    });
  }

  private loadCommunityData(profileId: number): void {
    this.communityApi.getAllCommunityProfiles(profileId).subscribe({
      next: (profiles) => {
        this.communityProfile.set(profiles && profiles.length ? CommunityProfileAssembler.toEntityFromResource(profiles[0]) : null);
      },
      error: () => {
        this.communityProfile.set(null);
      }
    });
    this.communityApi.getAllReviews(profileId).subscribe({
      next: (reviews: any) => {
        const received = reviews
          .map((r: any) => ReviewAssembler.toEntityFromResource(r))
          .filter((r: Review) => r.targetType === 'PROFILE' && Number(r.targetProfileId) === Number(profileId))
          .sort((a: Review, b: Review) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
          .slice(0, 5);
        this.receivedReviews.set(received);
        this.isLoading.set(false);
      },
      error: () => {
        this.receivedReviews.set([]);
        this.isLoading.set(false);
      }
    });
  }

  openEdit(): void {
    const profile = this.profileStore.currentProfile() ?? this.profileContext.currentProfile();
    if (profile) this.patchEditForm(profile);
    this.isEditing.set(true);
  }

  closeEdit(): void {
    this.isEditing.set(false);
  }

  saveProfile(): void {
    const profile = this.profileStore.currentProfile() ?? this.profileContext.currentProfile();
    if (!profile) return;
    this.isSaving.set(true);
    const value = this.editForm.value;
    this.profileStore.updateProfile({
      fundoName: String(value.fundoName).trim(),
      contactPhone: String(value.contactPhone).trim(),
      moistureThreshold: this.isAgricultural() ? Number(value.moistureThreshold) : profile.moistureThreshold,
      temperatureThreshold: this.isAgricultural() ? Number(value.temperatureThreshold) : profile.temperatureThreshold,
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditing.set(false);
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('profile.management.update-error');
      }
    });
  }

  onFieldCreated(): void {
    this.loadFields();
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}
