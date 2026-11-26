import {BaseEntity} from '../../../shared/domain/model/base.entity';

/**
 * User entity representing the authenticated identity in IAM.
 */
export class User implements BaseEntity {
  constructor(
    public id: number,
    public email: string,
    public roles: readonly string[] = [],
  ) {
  }
}
