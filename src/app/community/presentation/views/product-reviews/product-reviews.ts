import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {CurrencyPipe, DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CommunityStore} from '../../../application/community.store';
import {ProfileContextService} from '../../../../profile/application/profile-context.service';
import {CommunityApi} from '../../../infrastructure/community-api';
import {ReviewAssembler} from '../../../infrastructure/review.assembler';
import {ProductApi} from '../../../../stock/infrastructure/product-api';
import {Review} from '../../../domain/model/review.entity';
import {CreateReviewRequest} from '../../../infrastructure/create-review.request';
import {COMMUNITY_ERROR_CODES} from '../../../domain/model/community.constants';

@Component({
  imports: [TranslatePipe, DatePipe, CurrencyPipe, FormsModule],
  selector: 'app-product-reviews',
  styleUrl: './product-reviews.css',
  templateUrl: './product-reviews.html',
})
export class ProductReviews implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private communityStore = inject(CommunityStore);
  private profileContext = inject(ProfileContextService);
  private communityApi = inject(CommunityApi);
  private productApi = inject(ProductApi);

  readonly productId = signal<number | null>(null);
  readonly productName = signal<string>('');
  readonly productImageUrl = signal<string | null>(null);
  readonly productPrice = signal<number | null>(null);
  readonly producerProfileId = signal<number | null>(null);
  readonly producerName = signal<string>('');
  readonly reviews = signal<Review[]>([]);
  readonly authorNames = signal<Map<number, string>>(new Map());

  readonly reviewRating = signal(5);
  readonly reviewContent = signal('');
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly averageRating = computed(() => {
    const list = this.reviews();
    if (list.length === 0) return 0;
    return +(list.reduce((sum, r) => sum + Number(r.rating), 0) / list.length).toFixed(1);
  });

  readonly ratingDistribution = computed(() => {
    const list = this.reviews();
    const dist = [0,0,0,0,0];
    for (const r of list) {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
    }
    return dist;
  });

  ngOnInit(): void {
    this.profileContext.fetchCurrentProfile().subscribe({
      next: () => {},
      error: () => this.errorMessage.set('community.errors.no-author-profile'),
    });

    const id = Number(this.route.snapshot.paramMap.get('productId'));
    this.productId.set(id);
    this.productApi.getProductById(id).subscribe({
      next: (p) => {
        this.productName.set(p.name);
        this.productImageUrl.set(p.imageUrl ?? null);
        this.productPrice.set(p.price);
        this.productApi.getProducer(p.id).subscribe({
          next: (producer) => {
            this.producerName.set(producer.fundoName);
            this.producerProfileId.set(producer.profileId);
          },
          error: () => {},
        });
      },
      error: () => {
        this.errorMessage.set('community.errors.product-not-found');
      },
    });
    this.loadReviews();
  }

  loadReviews(): void {
    const id = this.productId();
    if (!id) return;
    this.communityApi.getAllReviews(undefined, undefined, id).subscribe({
      next: (resources) => {
        const reviews = resources.map((r) => ReviewAssembler.toEntityFromResource(r));
        this.reviews.set(reviews);
        const uniqueAuthors = [...new Set(reviews.map((r) => r.authorProfileId))];
        const names = new Map<number, string>();
        for (const authorId of uniqueAuthors) {
          this.communityApi.getAllCommunityProfiles(authorId).subscribe({
            next: (profiles) => {
              if (profiles && profiles.length > 0) {
                names.set(authorId, profiles[0].nickname);
                this.authorNames.set(new Map(names));
              } else {
                names.set(authorId, 'community.member');
                this.authorNames.set(new Map(names));
              }
            },
            error: () => {
              names.set(authorId, 'community.member');
              this.authorNames.set(new Map(names));
            },
          });
        }
        this.authorNames.set(names);
      },
      error: () => this.reviews.set([]),
    });
  }

  submitReview(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    const profileId = this.profileContext.currentProfileId();
    const productId = this.productId();
    const producerProfileId = this.producerProfileId();
    const rating = this.reviewRating();
    const content = this.reviewContent().trim();

    if (!profileId) {
      this.errorMessage.set('community.errors.no-author-profile');
      return;
    }
    if (!producerProfileId) {
      this.errorMessage.set('community.errors.no-producer-profile');
      return;
    }
    if (rating < 1 || rating > 5) {
      this.errorMessage.set('community.form.error-rating');
      return;
    }
    if (!content) {
      this.errorMessage.set('community.form.error-content');
      return;
    }
    if (profileId === producerProfileId) {
      this.errorMessage.set('community.form.error-self-review');
      return;
    }

    this.isSubmitting.set(true);
    const request: CreateReviewRequest = {
      author_profile_id: profileId,
      target_type: 'PRODUCT',
      target_profile_id: producerProfileId,
      product_id: productId!,
      content,
      rating,
    };
    this.communityStore.createReview(request).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('community.form.success');
        this.reviewContent.set('');
        this.reviewRating.set(5);
        this.loadReviews();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        const code = error instanceof Error ? error.message : '';
        switch (code) {
          case COMMUNITY_ERROR_CODES.SELF_REVIEW_NOT_ALLOWED:
            this.errorMessage.set('community.form.error-self-review');
            break;
          case COMMUNITY_ERROR_CODES.INVALID_RATING:
            this.errorMessage.set('community.form.error-rating');
            break;
          case COMMUNITY_ERROR_CODES.UNRESOLVED_TARGET:
          case COMMUNITY_ERROR_CODES.INVALID_TARGET:
            this.errorMessage.set('community.form.error-target');
            break;
          default:
            this.errorMessage.set('community.form.error-submit');
        }
      }
    });
  }

  back(): void {
    this.router.navigate(['/community']);
  }
}