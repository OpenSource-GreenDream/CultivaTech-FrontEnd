import {computed, inject, Service, signal} from '@angular/core';
import {CommunityApi} from '../infrastructure/community-api';
import {CommunityProfile} from '../domain/model/community-profile.entity';
import {Review} from '../domain/model/review.entity';
import {catchError, forkJoin, map, Observable, of, tap, throwError} from 'rxjs';
import {CommunityProfileAssembler} from '../infrastructure/community-profile.assembler';
import {ReviewAssembler} from '../infrastructure/review.assembler';
import {CreateReviewRequest} from '../infrastructure/create-review.request';
import {UpdateReviewRequest} from '../infrastructure/update-review.request';
import {CreateCommunityProfileRequest} from '../infrastructure/create-community-profile.request';
import {UpdateCommunityProfileRequest} from '../infrastructure/update-community-profile.request';
import {FieldApi} from '../../profile/infrastructure/field-api';
import {FieldAssembler} from '../../profile/infrastructure/field.assembler';
import {Field} from '../../profile/domain/model/field.entity';
import {ProductApi} from '../../stock/infrastructure/product-api';
import {ProductAssembler} from '../../stock/infrastructure/product.assembler';
import {Product} from '../../stock/domain/model/product.entity';
import {AuthService} from '../../iam/application/auth.service';
import {ProfileContextService} from '../../profile/application/profile-context.service';
import {
  COMMUNITY_ERROR_CODES,
  REVIEW_MAX_RATING,
  REVIEW_MIN_RATING,
} from '../domain/model/community.constants';

export interface TargetReputationSummary {
  id: number;
  name: string;
  targetType: 'FIELD' | 'PRODUCT';
  ownerProfileId?: number;
  averageRating: number;
  reviewCount: number;
}

@Service()
export class CommunityStore {
  private communityApi = inject(CommunityApi);
  private fieldApi = inject(FieldApi);
  private productApi = inject(ProductApi);
  private authService = inject(AuthService);
  private profileContext = inject(ProfileContextService);

  readonly communityProfiles = signal<CommunityProfile[]>([]);
  readonly currentCommunityProfile = signal<CommunityProfile | null>(null);
  readonly fields = signal<Field[]>([]);
  readonly products = signal<Product[]>([]);
  readonly reviews = signal<Review[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly currentProfileId = computed(() => this.profileContext.currentProfileId());

  readonly fieldReputationSummaries = computed<TargetReputationSummary[]>(() => {
    const reviewsList = this.reviews();
    const currentProfileId = this.currentProfileId();

    return this.fields()
      .filter((field) => currentProfileId === null || Number(field.profileId) === Number(currentProfileId))
      .map((field) => {
        const matching = reviewsList.filter(
          (review) => review.targetType === 'FIELD' && Number(review.fieldId) === Number(field.id)
        );
        const count = matching.length;
        const avg =
          count > 0
            ? +(matching.reduce((sum, item) => sum + Number(item.rating), 0) / count).toFixed(1)
            : 0;
        return {
          id: field.id,
          name: field.name,
          targetType: 'FIELD',
          ownerProfileId: field.profileId,
          averageRating: avg,
          reviewCount: count
        };
      });
  });

  readonly productReputationSummaries = computed<TargetReputationSummary[]>(() => {
    const reviewsList = this.reviews();
    const currentProfileId = this.currentProfileId();

    return this.products()
      .map((product) => ({
        product,
        ownerProfileId: this.resolveProductOwnerProfileId(product.id),
      }))
      .filter(({ ownerProfileId }) =>
        currentProfileId === null || Number(ownerProfileId) === Number(currentProfileId)
      )
      .map(({ product, ownerProfileId }) => {
        const matching = reviewsList.filter(
          (review) => review.targetType === 'PRODUCT' && Number(review.productId) === Number(product.id)
        );
        const count = matching.length;
        const avg =
          count > 0
            ? +(matching.reduce((sum, item) => sum + Number(item.rating), 0) / count).toFixed(1)
            : 0;
        return {
          id: product.id,
          name: product.name,
          targetType: 'PRODUCT',
          ownerProfileId: ownerProfileId ?? undefined,
          averageRating: avg,
          reviewCount: count
        };
      });
  });

  constructor() {
    this.authService.registerCleanup(() => this.clearState());
  }

  clearState(): void {
    this.communityProfiles.set([]);
    this.currentCommunityProfile.set(null);
    this.fields.set([]);
    this.products.set([]);
    this.reviews.set([]);
    this.loading.set(false);
    this.error.set(null);
  }

  loadCommunityContextData(): Observable<void> {
    this.loading.set(true);
    this.error.set(null);
    return forkJoin({
      profilesRaw: this.communityApi.getAllCommunityProfiles(),
      fieldsRaw: this.fieldApi.getFields(),
      productsRaw: this.productApi.getProducts(),
      reviewsRaw: this.communityApi.getAllReviews(),
    }).pipe(
      tap(({ profilesRaw, fieldsRaw, productsRaw, reviewsRaw }) => {
        const profiles = profilesRaw.map((res) => CommunityProfileAssembler.toEntityFromResource(res));
        const fields = fieldsRaw.map((res) => FieldAssembler.toEntityFromResource(res));
        const products = productsRaw.map((res) => ProductAssembler.toEntityFromResource(res));

        this.communityProfiles.set(profiles);
        this.fields.set(fields);
        this.products.set(products);
        this.reviews.set(reviewsRaw.map((res) => ReviewAssembler.toEntityFromResource(res)));

        const profileId = this.currentProfileId();
        if (profileId !== null) {
          const current = profiles.find((p) => Number(p.profileId) === Number(profileId)) ?? null;
          this.currentCommunityProfile.set(current);
        }
      }),
      map(() => void 0),
      tap(() => this.loading.set(false)),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('community.errors.load');
        return throwError(() => error);
      })
    );
  }

  loadAllCommunityProfiles(profileId?: number): Observable<CommunityProfile[]> {
    this.loading.set(true);
    this.error.set(null);
    return this.communityApi.getAllCommunityProfiles(profileId).pipe(
      map(resources => resources.map(res => CommunityProfileAssembler.toEntityFromResource(res))),
      tap(profiles => {
        this.communityProfiles.set(profiles);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('community.errors.load');
        return throwError(() => error);
      })
    );
  }

  loadCurrentCommunityProfile(): Observable<CommunityProfile | null> {
    const profileId = this.currentProfileId();
    if (profileId === null) {
      this.currentCommunityProfile.set(null);
      return of(null);
    }
    this.loading.set(true);
    this.error.set(null);
    return this.communityApi.getAllCommunityProfiles(profileId).pipe(
      map(resources => {
        if (!resources || resources.length === 0) return null;
        return CommunityProfileAssembler.toEntityFromResource(resources[0]);
      }),
      tap(profile => {
        this.currentCommunityProfile.set(profile);
        if (profile) {
          this.communityProfiles.update((current) => {
            const idx = current.findIndex((p) => p.id === profile.id);
            if (idx === -1) return [...current, profile];
            const next = [...current];
            next[idx] = profile;
            return next;
          });
        }
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('community.errors.load');
        return throwError(() => error);
      })
    );
  }

  createCommunityProfile(request: CreateCommunityProfileRequest): Observable<CommunityProfile> {
    this.loading.set(true);
    this.error.set(null);
    return this.communityApi.createCommunityProfile(request).pipe(
      map(res => CommunityProfileAssembler.toEntityFromResource(res)),
      tap(profile => {
        this.communityProfiles.update((current) => [...current, profile]);
        this.currentCommunityProfile.set(profile);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('community.errors.profile-save');
        return throwError(() => error);
      })
    );
  }

  updateCommunityProfile(id: number, request: UpdateCommunityProfileRequest): Observable<CommunityProfile> {
    this.loading.set(true);
    this.error.set(null);
    return this.communityApi.updateCommunityProfile(id, request).pipe(
      map(res => CommunityProfileAssembler.toEntityFromResource(res)),
      tap(profile => {
        this.communityProfiles.update((current) =>
          current.map((p) => (p.id === profile.id ? profile : p))
        );
        if (this.currentCommunityProfile()?.id === profile.id) {
          this.currentCommunityProfile.set(profile);
        }
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('community.errors.profile-save');
        return throwError(() => error);
      })
    );
  }

  deleteCommunityProfile(id: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);
    return this.communityApi.deleteCommunityProfile(id).pipe(
      tap(() => {
        this.communityProfiles.update((current) => current.filter((p) => p.id !== id));
        if (this.currentCommunityProfile()?.id === id) {
          this.currentCommunityProfile.set(null);
        }
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('community.errors.profile-delete');
        return throwError(() => error);
      })
    );
  }

  loadReviews(targetProfileId?: number, fieldId?: number, productId?: number): Observable<Review[]> {
    this.loading.set(true);
    this.error.set(null);
    return this.communityApi.getAllReviews(targetProfileId, fieldId, productId).pipe(
      map(resources => resources.map(res => ReviewAssembler.toEntityFromResource(res))),
      tap(reviews => {
        this.reviews.set(reviews);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('community.errors.load');
        return throwError(() => error);
      })
    );
  }

  loadReviewsForTarget(targetProfileId: number): Observable<Review[]> {
    return this.loadReviews(targetProfileId);
  }

  refreshCommunityProfile(profileId: number): Observable<CommunityProfile | null> {
    return this.communityApi.getCommunityProfileById(profileId).pipe(
      map(res => CommunityProfileAssembler.toEntityFromResource(res)),
      tap(profile => {
        this.communityProfiles.update((current) => {
          const idx = current.findIndex((p) => p.id === profile.id);
          if (idx === -1) return [...current, profile];
          const next = [...current];
          next[idx] = profile;
          return next;
        });
        if (this.currentCommunityProfile()?.id === profile.id) {
          this.currentCommunityProfile.set(profile);
        }
      }),
      catchError(() => of(null))
    );
  }

  createReview(request: CreateReviewRequest): Observable<Review> {
    const numericRating = Number(request.rating);
    if (
      !Number.isFinite(numericRating) ||
      numericRating < REVIEW_MIN_RATING ||
      numericRating > REVIEW_MAX_RATING
    ) {
      return throwError(() => new Error(COMMUNITY_ERROR_CODES.INVALID_RATING));
    }

    const resolvedTargetProfileId = this.resolveReviewTargetProfileId(
      request.target_type === 'PRODUCT' ? 'PRODUCT' : 'FIELD',
      request.field_id ?? null,
      request.product_id ?? null,
    );

    if (resolvedTargetProfileId === null) {
      return throwError(() => new Error(COMMUNITY_ERROR_CODES.UNRESOLVED_TARGET));
    }

    if (Number(resolvedTargetProfileId) !== Number(request.target_profile_id)) {
      return throwError(() => new Error(COMMUNITY_ERROR_CODES.INVALID_TARGET));
    }

    if (Number(resolvedTargetProfileId) === Number(request.author_profile_id)) {
      return throwError(() => new Error(COMMUNITY_ERROR_CODES.SELF_REVIEW_NOT_ALLOWED));
    }

    const sanitizedRequest: CreateReviewRequest = {
      ...request,
      target_profile_id: resolvedTargetProfileId,
      rating: Math.round(numericRating)
    };

    this.loading.set(true);
    this.error.set(null);
    return this.communityApi.createReview(sanitizedRequest).pipe(
      map(resource => {
        const entity = ReviewAssembler.toEntityFromResource(resource);
        if (sanitizedRequest.target_type) {
          entity.targetType = sanitizedRequest.target_type;
        }
        if (sanitizedRequest.field_id !== undefined) {
          entity.fieldId = sanitizedRequest.field_id;
        }
        if (sanitizedRequest.product_id !== undefined) {
          entity.productId = sanitizedRequest.product_id;
        }
        return entity;
      }),
      tap(newReview => {
        this.reviews.update(current => [newReview, ...current]);
        if (newReview.targetProfileId) {
          this.refreshCommunityProfile(newReview.targetProfileId).subscribe();
        }
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('community.errors.review-save');
        return throwError(() => error);
      })
    );
  }

  updateReview(id: number, request: UpdateReviewRequest): Observable<Review> {
    this.loading.set(true);
    this.error.set(null);
    const existing = this.reviews().find((r) => r.id === id);
    return this.communityApi.updateReview(id, request).pipe(
      map(resource => ReviewAssembler.toEntityFromResource(resource)),
      tap(updated => {
        if (existing) {
          updated.targetType = existing.targetType;
          updated.fieldId = existing.fieldId;
          updated.productId = existing.productId;
          updated.targetProfileId = existing.targetProfileId;
          updated.authorProfileId = existing.authorProfileId;
        }
        this.reviews.update(current => current.map((r) => (r.id === id ? updated : r)));
        if (updated.targetProfileId) {
          this.refreshCommunityProfile(updated.targetProfileId).subscribe();
        }
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('community.errors.review-save');
        return throwError(() => error);
      })
    );
  }

  deleteReview(id: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);
    const existing = this.reviews().find((r) => r.id === id);
    const targetProfileId = existing?.targetProfileId;
    return this.communityApi.deleteReview(id).pipe(
      tap(() => {
        this.reviews.update(current => current.filter((r) => r.id !== id));
        if (targetProfileId) {
          this.refreshCommunityProfile(targetProfileId).subscribe();
        }
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('community.errors.review-delete');
        return throwError(() => error);
      })
    );
  }

  resolveProductOwnerProfileId(productId: number): number | null {
    const product = this.products().find((item) => Number(item.id) === Number(productId));
    if (!product || product.fieldId === null || product.fieldId === undefined) {
      return null;
    }
    const field = this.fields().find((item) => Number(item.id) === Number(product.fieldId));
    return field ? Number(field.profileId) : null;
  }

  resolveReviewTargetProfileId(
    targetType: 'FIELD' | 'PRODUCT',
    fieldId: number | null,
    productId: number | null,
  ): number | null {
    if (targetType === 'FIELD') {
      const field = this.fields().find((item) => Number(item.id) === Number(fieldId));
      return field ? Number(field.profileId) : null;
    }
    return productId === null ? null : this.resolveProductOwnerProfileId(productId);
  }
}