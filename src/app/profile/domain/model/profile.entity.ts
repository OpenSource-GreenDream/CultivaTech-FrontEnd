import {BaseEntity} from '../../../shared/domain/model/base.entity';

/**
 * Profile entity representing the farm/fundo profile owned by a user.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export class Profile implements BaseEntity {
  constructor(
    public id: number,
    public userId: number,
    public fundoName: string,
    public contactPhone: string,
    public moistureThreshold: number,
    public tempThreshold: number
  ) {
  }
}
