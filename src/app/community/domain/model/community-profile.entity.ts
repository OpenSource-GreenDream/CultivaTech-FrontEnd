import {BaseEntity} from '../../../shared/domain/model/base.entity';

/**
 * Community Profile entity representing user's reputation and social presence
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export class CommunityProfile implements BaseEntity {
  constructor(
    public id: number,
    public profileId: number,
    public nickname: string,
    public reputationScore: number,
    public publicBio: string,
    public visibilityStatus: number
  ) {
  }
}
