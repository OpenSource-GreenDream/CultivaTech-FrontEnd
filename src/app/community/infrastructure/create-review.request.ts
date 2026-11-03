import {ReviewTargetType} from '../domain/model/review.entity';

/**
 * Request payload to create a new Review / Comment (US34).
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export interface CreateReviewRequest {
  author_profile_id: number;
  target_profile_id: number;
  target_type?: ReviewTargetType;
  field_id?: number | null;
  product_id?: number | null;
  content: string;
  rating: number;
}
