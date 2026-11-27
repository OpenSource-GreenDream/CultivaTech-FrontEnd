import {inject, Service} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';
import {ReviewResource} from './review.response';
import {CreateReviewRequest} from './create-review.request';
import {UpdateReviewRequest} from './update-review.request';
import {CommunityProfileResource} from './community-profile.response';
import {CreateCommunityProfileRequest} from './create-community-profile.request';
import {UpdateCommunityProfileRequest} from './update-community-profile.request';

@Service()
export class CommunityApi {
  private http = inject(HttpClient);
  private commentsUrl = `${environment.cultivatechBaseApi}${environment.commentsEndpoint}`;
  private communityProfilesUrl = `${environment.cultivatechBaseApi}${environment.communityProfilesEndpoint}`;

  getAllCommunityProfiles(profileId?: number): Observable<CommunityProfileResource[]> {
    let params = new HttpParams();
    if (profileId !== undefined && profileId !== null) {
      params = params.set('profile_id', profileId.toString());
    }
    return this.http.get<CommunityProfileResource[]>(this.communityProfilesUrl, { params });
  }

  getCommunityProfileById(id: number): Observable<CommunityProfileResource> {
    return this.http.get<CommunityProfileResource>(`${this.communityProfilesUrl}/${id}`);
  }

  createCommunityProfile(request: CreateCommunityProfileRequest): Observable<CommunityProfileResource> {
    return this.http.post<CommunityProfileResource>(this.communityProfilesUrl, request);
  }

  updateCommunityProfile(id: number, request: UpdateCommunityProfileRequest): Observable<CommunityProfileResource> {
    return this.http.put<CommunityProfileResource>(`${this.communityProfilesUrl}/${id}`, request);
  }

  deleteCommunityProfile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.communityProfilesUrl}/${id}`);
  }

  getAllReviews(targetProfileId?: number, fieldId?: number, productId?: number): Observable<ReviewResource[]> {
    let params = new HttpParams();
    if (targetProfileId !== undefined && targetProfileId !== null) {
      params = params.set('target_profile_id', targetProfileId.toString());
    }
    if (fieldId !== undefined && fieldId !== null) {
      params = params.set('field_id', fieldId.toString());
    }
    if (productId !== undefined && productId !== null) {
      params = params.set('product_id', productId.toString());
    }
    return this.http.get<ReviewResource[]>(this.commentsUrl, { params });
  }

  getReviewById(id: number): Observable<ReviewResource> {
    return this.http.get<ReviewResource>(`${this.commentsUrl}/${id}`);
  }

  createReview(request: CreateReviewRequest): Observable<ReviewResource> {
    return this.http.post<ReviewResource>(this.commentsUrl, request);
  }

  updateReview(id: number, request: UpdateReviewRequest): Observable<ReviewResource> {
    return this.http.put<ReviewResource>(`${this.commentsUrl}/${id}`, request);
  }

  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.commentsUrl}/${id}`);
  }
}