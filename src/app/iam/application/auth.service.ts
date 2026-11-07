import {computed, inject, Injector, Service, signal} from '@angular/core';
import {User} from '../domain/model/user.entity';
import {Role} from '../domain/model/role.entity';
import {IamStore} from './iam.store';
import {environment} from '../../../environments/environment';
import {IAM_SESSION_STORAGE_KEY} from '../domain/model/iam.constants';

export interface PersistedSessionState {
  user_id: number;
  email_address: string;
  role?: string;
  roles: Array<{ id: number; name: string; description: string }>;
}

/**
 * Application service for IAM session management across Bounded Contexts.
 * Roles are treated as dynamic backend data: any role name returned by the
 * API is preserved and compared case-insensitively instead of being restricted
 * to a hardcoded union.
 * @author Jorge Manuel Retuerto Rodriguez - U202318612
 */
@Service()
export class AuthService {
  private readonly injector = inject(Injector);
  private readonly cleanupCallbacks = new Set<() => void>();
  private readonly storageKey = environment.sessionStorageKey || IAM_SESSION_STORAGE_KEY;

  readonly currentUser = signal<User | null>(null);

  readonly isSignedIn = computed(() => this.currentUser() !== null);

  /**
   * Normalized role names of the current user. No fixed role catalog is
   * assumed, so roles created in the backend are automatically supported.
   */
  readonly currentUserRoles = computed<string[]>(() => {
    const user = this.currentUser();
    if (!user || !user.roles) return [];
    return user.roles
      .map((role) => this.normalizeRoleName(role.name))
      .filter((role): role is string => role !== null);
  });

  /**
   * Principal role assigned to the current user, when one is available.
   */
  readonly currentRole = computed<string | null>(() => {
    const roles = this.currentUserRoles();
    return roles.length > 0 ? roles[0] : null;
  });

  constructor() {
    this.hydrateSession();
  }

  /**
   * Verify if current user has a specific role (case-insensitive).
   */
  hasRole(roleName: string): boolean {
    const expected = this.normalizeRoleName(roleName);
    if (!expected) return false;
    return this.currentUserRoles().includes(expected);
  }

  /**
   * Verify if current user has at least one of the allowed roles.
   */
  hasAnyRole(allowedRoles: readonly string[]): boolean {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.some((role) => this.hasRole(role));
  }

  /**
   * Set active user session in memory and persist in localStorage.
   */
  setSession(user: User): void {
    this.currentUser.set(user);
    this.persistSession(user);
  }

  registerCleanup(callback: () => void): void {
    this.cleanupCallbacks.add(callback);
  }

  signOut(): void {
    this.currentUser.set(null);
    this.clearPersistedSession();
    const iamStore = this.injector.get(IamStore, null, { optional: true });
    iamStore?.clearSession();
    this.cleanupCallbacks.forEach((callback) => callback());
  }

  private hydrateSession(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as Partial<PersistedSessionState>;
      const userId = Number(parsed?.user_id);
      const email = typeof parsed?.email_address === 'string' ? parsed.email_address.trim() : '';

      if (!Number.isFinite(userId) || userId <= 0 || !email) {
        this.clearPersistedSession();
        return;
      }

      const roles: Role[] = Array.isArray(parsed.roles) && parsed.roles.length > 0
        ? parsed.roles.map(
            (role) => new Role(
              Number(role.id) || 0,
              String(role.name || ''),
              String(role.description || ''),
            ),
          )
        : parsed.role
          ? [new Role(0, String(parsed.role), '')]
          : [];

      this.currentUser.set(new User(userId, email, roles));
    } catch {
      this.clearPersistedSession();
    }
  }

  private persistSession(user: User): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const roles = (user.roles ?? []).map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
      }));
      const sessionPayload: PersistedSessionState = {
        user_id: user.id,
        email_address: user.email_address,
        role: this.normalizeRoleName(roles[0]?.name) ?? undefined,
        roles,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(sessionPayload));
    } catch {
      // Ignore storage quota errors
    }
  }

  private clearPersistedSession(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore storage removal errors
    }
  }

  private normalizeRoleName(rawRole: string | undefined | null): string | null {
    if (!rawRole) return null;
    const normalized = rawRole.trim();
    return normalized.length > 0 ? normalized.toUpperCase() : null;
  }
}
