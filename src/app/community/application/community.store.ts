import {inject, Service, signal} from '@angular/core';
import {CommunityApi} from '../infrastructure/community-api';
import {CommunityProfile} from '../domain/model/community-profile.entity';
import {Review} from '../domain/model/review.entity';
import {catchError, map, Observable, of, tap} from 'rxjs';
import {CommunityProfileAssembler} from '../infrastructure/community-profile.assembler';
import {ReviewAssembler} from '../infrastructure/review.assembler';
import {CreateReviewRequest} from '../infrastructure/create-review.request';

/**
 * Application store for Community Bounded Context (Reputation, Reviews, and Ratings).
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class CommunityStore {
  private communityApi = inject(CommunityApi);

  readonly communityProfiles = signal<CommunityProfile[]>([]);
  readonly currentCommunityProfile = signal<CommunityProfile | null>(null);
  readonly reviews = signal<Review[]>([]);

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

  createReview(request: CreateReviewRequest): Observable<Review> {
    return this.communityApi.createReview(request).pipe(
      map(resource => ReviewAssembler.toEntityFromResource(resource)),
      tap(newReview => {
        this.reviews.update(current => [newReview, ...current]);
      })
    );
  }
}
