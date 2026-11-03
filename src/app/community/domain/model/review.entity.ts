import {BaseEntity} from '../../../shared/domain/model/base.entity';

export type ReviewTargetType = 'FIELD' | 'PRODUCT' | 'PROFILE';

/**
 * Review entity representing ratings and comments targeted at fields (lots), products, or profiles.
 */
export class Review implements BaseEntity {
  constructor(
    public id: number,
    public authorProfileId: number,
    public targetProfileId: number,
    public content: string,
    public rating: number,
    public targetType: ReviewTargetType = 'FIELD',
    public fieldId: number | null = null,
    public productId: number | null = null
  ) {
  }
}
