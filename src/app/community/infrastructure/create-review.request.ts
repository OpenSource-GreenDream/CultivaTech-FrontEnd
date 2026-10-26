/**
 * Request payload to create a new Review / Comment (US34).
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export interface CreateReviewRequest {
  author_profile_id: number;
  target_profile_id: number;
  content: string;
  rating: number;
}
