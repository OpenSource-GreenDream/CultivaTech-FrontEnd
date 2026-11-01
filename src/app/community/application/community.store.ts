import {computed, inject, Service, signal} from '@angular/core';
import {CommunityApi} from '../infrastructure/community-api';
import {CommunityProfile} from '../domain/model/community-profile.entity';
import {Review} from '../domain/model/review.entity';
import {catchError, forkJoin, map, Observable, of, tap, throwError} from 'rxjs';
import {CommunityProfileAssembler} from '../infrastructure/community-profile.assembler';
import {ReviewAssembler} from '../infrastructure/review.assembler';
import {CreateReviewRequest} from '../infrastructure/create-review.request';
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

/**
 * Application store for Community Bounded Context (Reputation, Reviews, and Ratings).
 * Supports reviews and reputation focused on Lots (fields) and Products (US32–US35).
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
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

  readonly currentProfileId = computed(() => this.profileContext.currentProfileId());

  /**
   * Reputation of the current farmer's lots. When no farm profile is active,
   * the full community reputation is returned.
   */
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

  /**
   * Reputation of the products owned by the current farmer (resolved through
   * `products.field_id`). When no farm profile is active, all products are shown.
   */
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
    this.authService.registerCleanup(() => {
      this.currentCommunityProfile.set(null);
      this.reviews.set([]);
    });
  }

  loadCommunityContextData(): Observable<void> {
    return forkJoin({
      profilesRaw: this.communityApi.getAllCommunityProfiles().pipe(catchError(() => of([]))),
      fieldsRaw: this.fieldApi.getFields().pipe(catchError(() => of([]))),
      productsRaw: this.productApi.getProducts().pipe(catchError(() => of([]))),
      reviewsRaw: this.communityApi.getAllReviews().pipe(catchError(() => of([])))
    }).pipe(
      tap(({ profilesRaw, fieldsRaw, productsRaw, reviewsRaw }) => {
        const profiles = profilesRaw.map((res) => CommunityProfileAssembler.toEntityFromResource(res));
        const fields = fieldsRaw.map((res) => FieldAssembler.toEntityFromResource(res));
        const products = productsRaw.map((res) => ProductAssembler.toEntityFromResource(res));

        this.communityProfiles.set(profiles);
        this.fields.set(fields);
        this.products.set(products);
        this.reviews.set(reviewsRaw.map((res) => ReviewAssembler.toEntityFromResource(res)));
      }),
      map(() => void 0)
    );
  }

  loadAllCommunityProfiles(): Observable<CommunityProfile[]> {
    return this.communityApi.getAllCommunityProfiles().pipe(
      map(resources => resources.map(res => CommunityProfileAssembler.toEntityFromResource(res))),
      tap(profiles => {
        this.communityProfiles.set(profiles);
      }),
      catchError(() => {
        this.communityProfiles.set([]);
        return of([]);
      })
    );
  }

  loadAllReviews(): Observable<Review[]> {
    return this.communityApi.getAllReviews().pipe(
      map(resources => resources.map(res => ReviewAssembler.toEntityFromResource(res))),
      tap(reviews => {
        this.reviews.set(reviews);
      }),
      catchError(() => {
        this.reviews.set([]);
        return of([]);
      })
    );
  }

  loadCommunityProfile(profileId: number): Observable<CommunityProfile | null> {
    return this.communityApi.getCommunityProfileByProfileId(profileId).pipe(
      map(resources => {
        if (!resources || resources.length === 0) return null;
        return CommunityProfileAssembler.toEntityFromResource(resources[0]);
      }),
      tap(profile => {
        this.currentCommunityProfile.set(profile);
      }),
      catchError(() => {
        this.currentCommunityProfile.set(null);
        return of(null);
      })
    );
  }

  loadReviewsForTarget(targetProfileId: number): Observable<Review[]> {
    return this.communityApi.getReviewsByTargetProfileId(targetProfileId).pipe(
      map(resources => resources.map(res => ReviewAssembler.toEntityFromResource(res))),
      tap(reviews => {
        this.reviews.set(reviews);
      }),
      catchError(() => {
        this.reviews.set([]);
        return of([]);
      })
    );
  }

  /**
   * Resolves the farm profile that owns a product through `products.field_id`.
   */
  resolveProductOwnerProfileId(productId: number): number | null {
    const product = this.products().find((item) => Number(item.id) === Number(productId));
    if (!product || product.fieldId === null || product.fieldId === undefined) {
      return null;
    }
    const field = this.fields().find((item) => Number(item.id) === Number(product.fieldId));
    return field ? Number(field.profileId) : null;
  }

  /**
   * Resolves the farm profile targeted by a review, validating the selected field/product.
   */
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
      })
    );
  }
}
