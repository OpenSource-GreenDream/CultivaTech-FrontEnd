import {BaseEntity} from '../../../shared/domain/model/base.entity';

/**
 * User entity to represents users in the project.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
export class User implements BaseEntity{
  constructor(
    public id: number,
    public email_address: string,
    public passwordHash: string
  ) {
  }
}
