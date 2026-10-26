import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {ReviewResource} from './review.response';
import {CreateReviewRequest} from './create-review.request';
import {CommunityProfileResource} from './community-profile.response';

/**
 * Service to consume Fake API for Community, Reviews and Reputation operations.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class CommunityApi {
  private http = inject(HttpClient);
  private commentsUrl = `${environment.cultivatechBaseApi}/comments`;
  private communityProfilesUrl = `${environment.cultivatechBaseApi}/community_profiles`;

  getAllCommunityProfiles(): Observable<CommunityProfileResource[]> {
    return this.http.get<CommunityProfileResource[]>(this.communityProfilesUrl);
  }

  getCommunityProfileByProfileId(profileId: number): Observable<CommunityProfileResource[]> {
    return this.http.get<CommunityProfileResource[]>(`${this.communityProfilesUrl}?profile_id=${profileId}`);
  }

  getAllReviews(): Observable<ReviewResource[]> {
    return this.http.get<ReviewResource[]>(this.commentsUrl);
  }

  getReviewsByTargetProfileId(targetProfileId: number): Observable<ReviewResource[]> {
    return this.http.get<ReviewResource[]>(`${this.commentsUrl}?target_profile_id=${targetProfileId}`);
  }

  createReview(request: CreateReviewRequest): Observable<ReviewResource> {
    const payload = {
      ...request,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return this.http.post<ReviewResource>(this.commentsUrl, payload);
  }
}
