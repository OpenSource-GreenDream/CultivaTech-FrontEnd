/**
 * Response structure for Review / Comment resource.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export interface ReviewResource {
  id: number;
  author_profile_id: number;
  target_profile_id: number;
  content: string;
  rating: number;
  created_at: string;
  updated_at: string;
}
