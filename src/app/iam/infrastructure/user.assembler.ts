import { Service } from '@angular/core';
import {RoleResource, UserResource} from './user-response';
import {User} from '../domain/model/user.entity';
import {Role} from '../domain/model/role.entity';

/**
 * Service to transform application with API.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class UserAssembler {
  static toEntityFromResource(resource: UserResource): User{
    const roles: Role[] = resource.roles?
      resource.roles.map((r: RoleResource) => new Role(r.id, r.name, r.description))
      : [];
    return new User(
      resource.id,
      resource.email_address,
      resource.password_hash,
      roles
    );
  }

  static toResourceFromEntity(entity: User): UserResource{
    const nowISO = new Date().toISOString();
    return {
      id: entity.id,
      email_address: entity.email_address,
      password_hash: entity.passwordHash,
      roles: entity.roles.map(r=>({
        id: r.id,
        name: r.name,
        description: r.description
      })),
      created_at: nowISO,
      updated_at: nowISO,
    };
  }
}
