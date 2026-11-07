import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable, of} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Role} from '../domain/model/role.entity';
import {RoleResource} from './user-response';

interface CollectionResource<T> {
  value: T[];
}

function unwrapCollection<T>(response: T[] | CollectionResource<T>): T[] {
  return Array.isArray(response) ? response : (response?.value ?? []);
}

@Service()
export class RoleApi {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${environment.cultivatechBaseApi}${environment.rolesEndpoint}`;

  getRoles(): Observable<Role[]> {
    return this.http
      .get<RoleResource[] | CollectionResource<RoleResource>>(this.resourceUrl)
      .pipe(
        map((response) =>
          unwrapCollection(response)
            .filter((resource) => resource && typeof resource.name === 'string')
            .map(
              (resource) =>
                new Role(
                  Number(resource.id) || 0,
                  resource.name.trim(),
                  resource.description ?? '',
                ),
            ),
        ),
      );
  }

  resolveRole(roleIdentifier: string | number): Observable<Role | null> {
    const identifier = String(roleIdentifier ?? '').trim();
    if (!identifier) {
      return of(null);
    }

    return this.getRoles().pipe(
      map((roles) => {
        const normalizedIdentifier = identifier.toLowerCase();
        return (
          roles.find((role) => String(role.id) === identifier) ??
          roles.find((role) => role.name.trim().toLowerCase() === normalizedIdentifier) ??
          null
        );
      }),
    );
  }
}
