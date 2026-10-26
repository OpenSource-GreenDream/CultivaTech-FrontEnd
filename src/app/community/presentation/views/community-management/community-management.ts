import {ChangeDetectorRef, Component, computed, inject, OnInit, signal} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {CommunityStore} from '../../../application/community.store';
import {ProfileContextService} from '../../../../profile/application/profile-context.service';
import {FormsModule} from '@angular/forms';
import {finalize, forkJoin} from 'rxjs';

@Component({
  imports: [
    TranslatePipe,
    FormsModule
  ],
  selector: 'app-community-management',
  styleUrl: './community-management.css',
  templateUrl: './community-management.html',
})
export class CommunityManagement implements OnInit {
  protected communityStore = inject(CommunityStore);
  private profileContext = inject(ProfileContextService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  isSubmitting = false;

  selectedTargetProfileId = signal<number | null>(null);

  currentPage = signal(1);
  pageSize = 5;

  paginatedReviews = computed(() => {
    const reviews = this.communityStore.reviews();
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return reviews.slice(startIndex, startIndex + this.pageSize);
  });

  totalPages = computed(() => {
    return Math.ceil(this.communityStore.reviews().length / this.pageSize) || 1;
  });

  newReview = {
    targetProfileId: 1,
    rating: 5,
    content: ''
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    this.communityStore.loadAllCommunityProfiles().subscribe({
      next: () => {
        const targetId = this.selectedTargetProfileId();
        const reviewsObservable = targetId
          ? this.communityStore.loadReviewsForTarget(targetId)
          : this.communityStore.loadAllReviews();

        reviewsObservable.pipe(
          finalize(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          })
        ).subscribe({
          next: () => {
            this.currentPage.set(1);
          },
          error: () => {
            this.currentPage.set(1);
          }
        });
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange(profileId: string): void {
    const numericId = profileId ? Number(profileId) : null;
    this.selectedTargetProfileId.set(numericId);
    this.loadData();
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
    if (!this.newReview.content.trim() || !this.newReview.rating) return;

    const currentProfileId = this.profileContext.currentProfileId() || 1;
    this.isSubmitting = true;

    const payload = {
      author_profile_id: currentProfileId,
      target_profile_id: Number(this.newReview.targetProfileId),
      content: this.newReview.content,
      rating: Number(this.newReview.rating)
    };

    this.communityStore.createReview(payload).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.newReview = { targetProfileId: 1, rating: 5, content: '' };
        this.currentPage.set(1);
      }
    });
  }
}
