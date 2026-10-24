import {computed, inject, Service, signal} from '@angular/core';
import {User} from '../domain/model/user.entity';

/**
 * Application service for others Bounded Context
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class AuthService {
  readonly currentUser = signal<User | null>(null);

  readonly isSignedIn = computed(() => this.currentUser() !== null);

  /**
   * Get a list of roles name of current user
   */
  readonly currentUserRoles = computed(() => {
    const user = this.currentUser();
    if (!user || !user.roles) return [];
    return user.roles.map(role => role.name);
  });

  /**
   * Get principal role assign to current user
   */
  readonly currentRole = computed(() => {
    const roles = this.currentUserRoles();
    return roles.length > 0 ? roles[0] : null;
  });

  /**
   * Helper optional to verify current user have a role
   */
  hasRole(roleName: string): boolean {
    const user = this.currentUser();
    if (!user || !user.roles) return false;
    return user.roles.some(role => role.name === roleName);
  }

  signOut(): void {
    this.currentUser.set(null);
  }
}
