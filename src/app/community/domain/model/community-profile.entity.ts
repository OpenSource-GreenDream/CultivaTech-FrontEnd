import {BaseEntity} from '../../../shared/domain/model/base.entity';

export class CommunityProfile implements BaseEntity {
  constructor(
    public id: number,
    public profileId: number,
    public nickname: string,
    public reputationScore: number,
    public publicBio: string,
    public visibilityStatus: number,
    public imageUrl: string | null = null,
    public createdAt?: string,
    public updatedAt?: string,
  ) {}
}