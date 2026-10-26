import {BaseEntity} from '../../../shared/domain/model/base.entity';

/**
 *
 */
export class Review implements BaseEntity{
  constructor(
    public id: number,
    public authorProfileId: number,
    public targetProfileId: number,
    public content: string,
    public rating: number
  ) {
  }
}
