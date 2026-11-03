import {computed, inject, Injector, Service, signal} from '@angular/core';
import {User} from '../domain/model/user.entity';
import {Role} from '../domain/model/role.entity';
import {IamStore} from './iam.store';
import {environment} from '../../../environments/environment';
import {
  IAM_SESSION_STORAGE_KEY,
  ROLE_DEFINITIONS,
  USER_ROLES,
  UserRoleType,
} from '../domain/model/iam.constants';

export interface PersistedSessionState {
  user_id: number;
  email_address: string;
  role: UserRoleType;
  roles: Array<{ id: number; name: string; description: string }>;
}

/**
 * Application service for IAM session management across Bounded Contexts
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
   * Get normalized role names of current user (AGRICULTOR, PROVEEDOR, CLIENTEB2B)
   */
  readonly currentUserRoles = computed<UserRoleType[]>(() => {
    const user = this.currentUser();
    if (!user || !user.roles) return [];
    return user.roles
      .map((role) => this.normalizeRoleName(role.name))
      .filter((role): role is UserRoleType => role !== null);
  });

  /**
   * Get principal role assigned to current user
   */
  readonly currentRole = computed<UserRoleType | null>(() => {
    const roles = this.currentUserRoles();
    return roles.length > 0 ? roles[0] : null;
  });

  constructor() {
    this.hydrateSession();
  }

  /**
   * Verify if current user has a specific role
   */
  hasRole(roleName: string): boolean {
    const expected = this.normalizeRoleName(roleName);
    if (!expected) return false;
    return this.currentUserRoles().includes(expected);
  }

  /**
   * Verify if current user has at least one of the allowed roles
   */
  hasAnyRole(allowedRoles: readonly string[]): boolean {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.some((role) => this.hasRole(role));
  }

  /**
   * Set active user session in memory and persist in localStorage
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
            (r) => new Role(Number(r.id) || 0, String(r.name || ''), String(r.description || '')),
          )
        : parsed.role
          ? [this.roleFromKey(parsed.role)]
          : [this.roleFromKey(USER_ROLES.AGRICULTOR)];

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
      const normalizedRole =
        this.normalizeRoleName(user.roles?.[0]?.name) ?? USER_ROLES.AGRICULTOR;
      const sessionPayload: PersistedSessionState = {
        user_id: user.id,
        email_address: user.email_address,
        role: normalizedRole,
        roles: (user.roles ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
        })),
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

  private normalizeRoleName(rawRole: string | undefined | null): UserRoleType | null {
    if (!rawRole) return null;
    const upper = rawRole.trim().toUpperCase();
    if (upper === USER_ROLES.AGRICULTOR) return USER_ROLES.AGRICULTOR;
    if (upper === USER_ROLES.PROVEEDOR) return USER_ROLES.PROVEEDOR;
    if (upper === USER_ROLES.CLIENTEB2B) return USER_ROLES.CLIENTEB2B;
    return null;
  }

  private roleFromKey(roleKey: string): Role {
    const normalized = this.normalizeRoleName(roleKey) ?? USER_ROLES.AGRICULTOR;
    const def = ROLE_DEFINITIONS[normalized];
    return new Role(def.id, def.name, def.description);
  }
}
