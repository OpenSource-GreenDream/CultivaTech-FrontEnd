import { Service } from '@angular/core';
import {UserResponse} from './user-response';
import {UserSummaryResponse} from './sign-in.response';
import {User} from '../domain/model/user.entity';
import {Role} from '../domain/model/role.entity';

/**
 * Service to transform application with API.
 * Artificial persistence metadata is no longer generated here.
 */
@Service()
export class UserAssembler {
  static toEntityFromResource(resource: UserResponse): User{
    const roles: string[] = resource.roles ? [...resource.roles] : [];
    return new User(
      resource.id,
      resource.email,
      roles,
    );
  }

  static toResourceFromEntity(entity: User): UserResponse{
    return {
      id: entity.id,
      email: entity.email,
      roles: [...entity.roles],
    };
  }

  static toEntityFromSummary(resource: UserSummaryResponse): User {
    return new User(resource.id, resource.email, [...resource.roles]);
  }
}
