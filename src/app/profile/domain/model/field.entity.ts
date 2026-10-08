import {BaseEntity} from '../../../shared/domain/model/base.entity';

/**
 * Field entity representing a specific land lot associated with a Profile.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export class Field implements BaseEntity {
  constructor(
    public id: number,
    public profileId: number,
    public name: string,
    public sizeM2: number,
    public soilType: string,
    public latitude: number,
    public longitude: number
  ) {
  }
}
