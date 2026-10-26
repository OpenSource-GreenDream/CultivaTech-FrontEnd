import {CommunityProfileResource} from './community-profile.response';
import {CommunityProfile} from '../domain/model/community-profile.entity';

/**
 * Assembler to transform CommunityProfile resources and entities.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export class CommunityProfileAssembler {
  static toEntityFromResource(resource: CommunityProfileResource): CommunityProfile {
    return new CommunityProfile(
      resource.id,
      resource.profile_id,
      resource.nickname,
      resource.reputation_score,
      resource.public_bio,
      resource.visibility_status
    );
  }

  static toResourceFromEntity(entity: CommunityProfile): CommunityProfileResource {
    const nowISO = new Date().toISOString();
    return {
      id: entity.id,
      profile_id: entity.profileId,
      nickname: entity.nickname,
      reputation_score: entity.reputationScore,
      public_bio: entity.publicBio,
      visibility_status: entity.visibilityStatus,
      created_at: nowISO,
      updated_at: nowISO,
    };
  }
}
