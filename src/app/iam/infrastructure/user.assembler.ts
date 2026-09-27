import { Service } from '@angular/core';
import {UserResource} from './user-response';
import {User} from '../domain/model/user.entity';

/**
 * Service to transform application with API.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class UserAssembler {
  static toEntityFromResource(resource: UserResource): User{
    return new User(
      resource.id,
      resource.email_address,
      resource.password_hash
    );
  }

  static toResourceFromEntity(entity: User): UserResource{
    const nowISO = new Date().toISOString();
    return {
      id: entity.id,
      email_address: entity.email_address,
      password_hash: entity.passwordHash,
      created_at: nowISO,
      updated_at: nowISO,
    };
  }
}
