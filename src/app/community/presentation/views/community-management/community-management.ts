import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {CommunityStore} from '../../../application/community.store';
import {ProfileContextService} from '../../../../profile/application/profile-context.service';
import {AuthService} from '../../../../iam/application/auth.service';
import {ProductApi} from '../../../../stock/infrastructure/product-api';
import {FormsModule} from '@angular/forms';
import {DatePipe} from '@angular/common';
import {catchError, finalize, of, switchMap} from 'rxjs';
import {Review} from '../../../domain/model/review.entity';
import {CreateCommunityProfileRequest} from '../../../infrastructure/create-community-profile.request';
import {UpdateCommunityProfileRequest} from '../../../infrastructure/update-community-profile.request';
import {UpdateReviewRequest} from '../../../infrastructure/update-review.request';
import {
  COMMUNITY_ERROR_CODES,
  COMMUNITY_PAGE_SIZE,
  REVIEW_MAX_RATING,
  REVIEW_MIN_RATING,
} from '../../../domain/model/community.constants';

@Component({
  imports: [
    TranslatePipe,
    FormsModule,
    DatePipe
  ],
  selector: 'app-community-management',
  styleUrl: './community-management.css',
  templateUrl: './community-management.html',
})
export class CommunityManagement implements OnInit {
  protected communityStore = inject(CommunityStore);
  protected profileContext = inject(ProfileContextService);
  private authService = inject(AuthService);
  private productApi = inject(ProductApi);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly activeTab = signal<'community' | 'profile'>('community');
  readonly searchTerm = signal('');
  readonly selectedProducer = signal<any>(null);
  readonly averageRatings = signal<Map<number, { average: number; count: number }>>(new Map());
  readonly productContextId = signal<number | null>(null);
  readonly productContextName = signal<string | null>(null);
  readonly productContextProducer = signal<string | null>(null);
  readonly hasCommunityProfile = computed(() => !!this.communityStore.currentCommunityProfile());
  readonly isFarmer = computed(() => this.authService.hasRole('FARMER'));

  readonly filteredProducers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.communityStore.communityProfiles()
      .filter((p) => Number(p.visibilityStatus) === 1)
      .filter((p) => !term || p.nickname.toLowerCase().includes(term) || (p.publicBio ?? '').toLowerCase().includes(term));
  });

  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly filterTargetType = signal<'ALL' | 'FIELD' | 'PRODUCT'>('ALL');
  readonly selectedFieldFilterId = signal<number | null>(null);
  readonly selectedProductFilterId = signal<number | null>(null);

  readonly currentPage = signal(1);
  readonly pageSize = COMMUNITY_PAGE_SIZE;

  /** Fields that can be reviewed by the current farmer (never their own). */
  readonly reviewableFields = computed(() => {
    const currentProfileId = this.profileContext.currentProfileId();
    return this.communityStore.fields().filter(
      (field) => currentProfileId === null || Number(field.profileId) !== Number(currentProfileId)
    );
  });

  /** Farm-owned products that can be reviewed by the current farmer (never their own). */
  readonly reviewableProducts = computed(() => {
    const currentProfileId = this.profileContext.currentProfileId();
    return this.communityStore.products().filter((product) => {
      const ownerProfileId = this.communityStore.resolveProductOwnerProfileId(product.id);
      return ownerProfileId !== null
        && (currentProfileId === null || ownerProfileId !== Number(currentProfileId));
    });
  });

  readonly reviewableProfiles = computed(() => {
    const currentProfileId = this.profileContext.currentProfileId();
    return this.communityStore.communityProfiles().filter(
      (profile) => currentProfileId === null || Number(profile.profileId) !== Number(currentProfileId)
    );
  });

  readonly filteredReviews = computed(() => {
    const typeFilter = this.filterTargetType();
    const fieldId = this.selectedFieldFilterId();
    const productId = this.selectedProductFilterId();

    return this.communityStore.reviews().filter((review) => {
      if (typeFilter === 'FIELD' && review.targetType !== 'FIELD') {
        return false;
      }
      if (typeFilter === 'PRODUCT' && review.targetType !== 'PRODUCT') {
        return false;
      }
      if (fieldId !== null && Number(review.fieldId) !== Number(fieldId)) {
        return false;
      }
      if (productId !== null && Number(review.productId) !== Number(productId)) {
        return false;
      }
      return true;
    });
  });

  readonly paginatedReviews = computed(() => {
    const reviews = this.filteredReviews();
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return reviews.slice(startIndex, startIndex + this.pageSize);
  });

  readonly totalPages = computed(() => {
    return Math.ceil(this.filteredReviews().length / this.pageSize) || 1;
  });

  readonly profileNickname = signal('');
  readonly profileBio = signal('');
  readonly profileVisibility = signal(1);
  readonly profileImageUrl = signal('');
  readonly isSavingProfile = signal(false);

  readonly editingReviewId = signal<number | null>(null);
  readonly editContent = signal('');
  readonly editRating = signal(5);

  newReview: {
    targetType: 'FIELD' | 'PRODUCT' | 'PROFILE';
    fieldId: number | null;
    productId: number | null;
    targetProfileId: number | null;
    rating: number;
    content: string;
  } = {
    targetType: 'FIELD',
    fieldId: null,
    productId: null,
    targetProfileId: null,
    rating: 5,
    content: ''
  };

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const targetType = qp.get('targetType');
    const productId = qp.get('productId');
    if (targetType === 'PRODUCT' && productId) {
      this.newReview.targetType = 'PRODUCT';
      this.newReview.productId = Number(productId);
      this.productContextId.set(Number(productId));
      this.selectedProductFilterId.set(Number(productId));
      this.filterTargetType.set('PRODUCT');
      this.productApi.getProductById(Number(productId)).subscribe({
        next: (product) => {
          this.productContextName.set(product.name);
          this.productApi.getProducer(product.id).subscribe({
            next: (producer) => this.productContextProducer.set(producer.fundoName),
            error: () => {},
          });
        },
        error: () => {},
      });
    }

    this.profileContext.fetchCurrentProfile().pipe(
      catchError(() => of(null)),
    ).subscribe(() => {
      this.loadData();
    });
  }

  loadData(): void {
    this.isLoading.set(true);
    this.communityStore.loadCommunityContextData().pipe(
      finalize(() => {
        const fields = this.reviewableFields();
        const products = this.reviewableProducts();
        if (this.newReview.fieldId === null && fields.length > 0) {
          this.newReview.fieldId = fields[0].id;
        }
        if (this.newReview.productId === null && products.length > 0) {
          this.newReview.productId = products[0].id;
        }
        const profiles = this.reviewableProfiles();
        if (this.newReview.targetProfileId === null && profiles.length > 0) {
          this.newReview.targetProfileId = profiles[0].profileId;
        }
        const current = this.communityStore.currentCommunityProfile();
        if (current) {
          this.profileNickname.set(current.nickname);
          this.profileBio.set(current.publicBio ?? '');
          this.profileVisibility.set(current.visibilityStatus ?? 1);
          this.profileImageUrl.set(current.imageUrl ?? '');
        }

        const publicProfiles = this.communityStore.communityProfiles().filter((p) => Number(p.visibilityStatus) === 1);
        const map = new Map<number, { average: number; count: number }>();
        for (const p of publicProfiles) {
          this.communityStore.getAverageProductRating(p.profileId).subscribe({
            next: (res) => {
              map.set(p.profileId, res);
              this.averageRatings.set(new Map(map));
            }
          });
        }
        this.averageRatings.set(map);

        this.isLoading.set(false);
      })
    ).subscribe({
      next: () => {
        this.currentPage.set(1);
      },
      error: () => {
        this.currentPage.set(1);
      }
    });
  }

  onTargetTypeFilterChange(type: 'ALL' | 'FIELD' | 'PRODUCT'): void {
    this.filterTargetType.set(type);
    this.selectedFieldFilterId.set(null);
    this.selectedProductFilterId.set(null);
    this.currentPage.set(1);
  }

  onFieldFilterChange(fieldId: string): void {
    const numericId = fieldId ? Number(fieldId) : null;
    this.selectedFieldFilterId.set(numericId);
    if (numericId !== null) {
      this.filterTargetType.set('FIELD');
      this.selectedProductFilterId.set(null);
    }
    this.currentPage.set(1);
  }

  onProductFilterChange(productId: string): void {
    const numericId = productId ? Number(productId) : null;
    this.selectedProductFilterId.set(numericId);
    if (numericId !== null) {
      this.filterTargetType.set('PRODUCT');
      this.selectedFieldFilterId.set(null);
    }
    this.currentPage.set(1);
  }

  getReviewTargetLabel(review: Review): string {
    if (review.targetType === 'PRODUCT' && review.productId) {
      const prod = this.communityStore.products().find(p => Number(p.id) === Number(review.productId));
      return prod ? prod.name : `#${review.productId}`;
    }
    if (review.fieldId) {
      const field = this.communityStore.fields().find(f => Number(f.id) === Number(review.fieldId));
      return field ? field.name : `#${review.fieldId}`;
    }
    const profile = this.communityStore
      .communityProfiles()
      .find(p => Number(p.profileId) === Number(review.targetProfileId));
    return profile ? profile.nickname : `#${review.targetProfileId}`;
  }

  getAuthorLabel(authorProfileId: number): string {
    const profile = this.communityStore
      .communityProfiles()
      .find(p => Number(p.profileId) === Number(authorProfileId));
    return profile ? profile.nickname : `#${authorProfileId}`;
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  submitReview(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const ratingNum = Number(this.newReview.rating);
    if (!Number.isFinite(ratingNum) || ratingNum < REVIEW_MIN_RATING || ratingNum > REVIEW_MAX_RATING) {
      this.errorMessage.set('community.form.error-rating');
      return;
    }

    if (!this.newReview.content.trim()) {
      this.errorMessage.set('community.form.error-content');
      return;
    }

    const currentProfileId = this.profileContext.currentProfileId();
    if (!currentProfileId) {
      this.errorMessage.set('community.form.error-no-profile');
      return;
    }

    const isFieldTarget = this.newReview.targetType === 'FIELD';
    const isProductTarget = this.newReview.targetType === 'PRODUCT';
    const isProfileTarget = this.newReview.targetType === 'PROFILE';
    const selectedFieldId = isFieldTarget ? Number(this.newReview.fieldId) : null;
    const selectedProductId = isProductTarget ? Number(this.newReview.productId) : null;
    const selectedTargetProfileId = isProfileTarget ? Number(this.newReview.targetProfileId) : null;

    if (isFieldTarget && !selectedFieldId) {
      this.errorMessage.set('community.form.error-target');
      return;
    }
    if (isProductTarget && !selectedProductId) {
      this.errorMessage.set('community.form.error-target');
      return;
    }
    if (isProfileTarget && !selectedTargetProfileId) {
      this.errorMessage.set('community.form.error-target');
      return;
    }

    const resolvedTargetProfileId = isProfileTarget
      ? selectedTargetProfileId
      : this.communityStore.resolveReviewTargetProfileId(
          isProductTarget ? 'PRODUCT' : 'FIELD',
          selectedFieldId,
          selectedProductId,
        );

    if (resolvedTargetProfileId === null) {
      this.errorMessage.set('community.form.error-target');
      return;
    }

    if (Number(resolvedTargetProfileId) === Number(currentProfileId)) {
      this.errorMessage.set('community.form.error-self-review');
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      author_profile_id: currentProfileId,
      target_profile_id: resolvedTargetProfileId,
      target_type: this.newReview.targetType,
      field_id: selectedFieldId,
      product_id: selectedProductId,
      content: this.newReview.content.trim(),
      rating: Math.round(ratingNum)
    };

    this.communityStore.createReview(payload).pipe(
      finalize(() => {
        this.isSubmitting.set(false);
      })
    ).subscribe({
      next: () => {
        this.successMessage.set('community.form.success');
        this.newReview.content = '';
        this.newReview.rating = REVIEW_MAX_RATING;
        this.currentPage.set(1);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.mapReviewError(error));
      }
    });
  }

  private mapReviewError(error: unknown): string {
    const code = error instanceof Error ? error.message : '';

    switch (code) {
      case COMMUNITY_ERROR_CODES.SELF_REVIEW_NOT_ALLOWED:
        return 'community.form.error-self-review';
      case COMMUNITY_ERROR_CODES.INVALID_RATING:
        return 'community.form.error-rating';
      case COMMUNITY_ERROR_CODES.INVALID_TARGET:
      case COMMUNITY_ERROR_CODES.UNRESOLVED_TARGET:
        return 'community.form.error-target';
      default:
        return 'community.form.error-submit';
    }
  }

  saveProfile(): void {
    const profileId = this.profileContext.currentProfileId();
    if (!profileId) return;
    this.isSavingProfile.set(true);
    this.errorMessage.set(null);
    const request: CreateCommunityProfileRequest = {
      profile_id: profileId,
      nickname: this.profileNickname(),
      public_bio: this.profileBio(),
      visibility_status: this.profileVisibility(),
      image_url: this.profileImageUrl().trim() ? this.profileImageUrl().trim() : null,
    };
    const current = this.communityStore.currentCommunityProfile();
    const obs = current
      ? this.communityStore.updateCommunityProfile(current.id, request as UpdateCommunityProfileRequest)
      : this.communityStore.createCommunityProfile(request);
    obs.pipe(finalize(() => this.isSavingProfile.set(false))).subscribe({
      next: () => this.successMessage.set('community.profile.saved'),
      error: () => this.errorMessage.set('community.profile.error-save'),
    });
  }

  deleteProfile(): void {
    const current = this.communityStore.currentCommunityProfile();
    if (!current) return;
    if (!confirm('Delete community profile?')) return;
    this.communityStore.deleteCommunityProfile(current.id).subscribe({
      next: () => {
        this.profileNickname.set('');
        this.profileBio.set('');
        this.successMessage.set('community.profile.deleted');
      },
      error: () => this.errorMessage.set('community.profile.error-delete'),
    });
  }

  startEditReview(review: Review): void {
    this.editingReviewId.set(review.id);
    this.editContent.set(review.content);
    this.editRating.set(review.rating);
  }

  cancelEditReview(): void {
    this.editingReviewId.set(null);
  }

  saveEditReview(review: Review): void {
    const request: UpdateReviewRequest = {
      content: this.editContent(),
      rating: this.editRating(),
    };
    this.communityStore.updateReview(review.id, request).subscribe({
      next: () => {
        this.editingReviewId.set(null);
        this.successMessage.set('community.form.success');
      },
      error: () => this.errorMessage.set('community.form.error-submit'),
    });
  }

  viewProducer(profile: any): void {
    this.router.navigate(['/community/producers', profile.id]);
  }

  clearProductContext(): void {
    this.productContextId.set(null);
    this.productContextName.set(null);
    this.productContextProducer.set(null);
    this.newReview.targetType = 'PROFILE';
  }

  deleteReview(review: Review): void {
    if (!confirm('Delete comment?')) return;
    this.communityStore.deleteReview(review.id).subscribe({
      next: () => this.successMessage.set('community.form.success'),
      error: () => this.errorMessage.set('community.form.error-submit'),
    });
  }
}
