import {inject, Service} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
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
  private commentsUrl = `${environment.cultivatechBaseApi}${environment.commentsEndpoint}`;
  private communityProfilesUrl = `${environment.cultivatechBaseApi}${environment.communityProfilesEndpoint}`;

  getAllCommunityProfiles(): Observable<CommunityProfileResource[]> {
    return this.http.get<CommunityProfileResource[]>(this.communityProfilesUrl);
  }

  getCommunityProfileByProfileId(profileId: number): Observable<CommunityProfileResource[]> {
    const params = new HttpParams().set('profile_id', profileId.toString());
    return this.http.get<CommunityProfileResource[]>(this.communityProfilesUrl, { params });
  }

  getAllReviews(): Observable<ReviewResource[]> {
    return this.http.get<ReviewResource[]>(this.commentsUrl);
  }

  getReviewsByTargetProfileId(targetProfileId: number): Observable<ReviewResource[]> {
    const params = new HttpParams().set('target_profile_id', targetProfileId.toString());
    return this.http.get<ReviewResource[]>(this.commentsUrl, { params });
  }

  getReviewsByFieldId(fieldId: number): Observable<ReviewResource[]> {
    const params = new HttpParams().set('field_id', fieldId.toString());
    return this.http.get<ReviewResource[]>(this.commentsUrl, { params });
  }

  getReviewsByProductId(productId: number): Observable<ReviewResource[]> {
    const params = new HttpParams().set('product_id', productId.toString());
    return this.http.get<ReviewResource[]>(this.commentsUrl, { params });
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
