/**
 * Response structure for Community Profile resource.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export interface CommunityProfileResource {
  id: number;
  profile_id: number;
  nickname: string;
  reputation_score: number;
  public_bio: string;
  visibility_status: number;
  created_at: string;
  updated_at: string;
}
