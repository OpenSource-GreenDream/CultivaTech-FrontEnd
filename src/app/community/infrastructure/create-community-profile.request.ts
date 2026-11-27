export interface CreateCommunityProfileRequest {
  profile_id: number;
  nickname: string;
  public_bio?: string;
  visibility_status?: number;
}