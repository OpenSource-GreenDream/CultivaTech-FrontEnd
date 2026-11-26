import {computed, inject, Injector, Service, signal} from '@angular/core';
import {User} from '../domain/model/user.entity';
import {environment} from '../../../environments/environment';
import {IAM_SESSION_STORAGE_KEY} from '../domain/model/iam.constants';
import {AuthSession} from './auth-session.model';
import {JwtDecoder} from '../infrastructure/jwt-decoder';
import {SignInResponse} from '../infrastructure/sign-in.response';
import {UserAssembler} from '../infrastructure/user.assembler';
import {IamStore} from './iam.store';

export interface PersistedAuthSession {
  userId: number;
  email: string;
  accessToken: string;
  tokenType: string;
  expiresAt: number;
  roles: string[];
}

@Service()
export class AuthService {
  private readonly injector = inject(Injector);
  private readonly cleanupCallbacks = new Set<() => void>();
  private readonly storageKey = environment.sessionStorageKey || IAM_SESSION_STORAGE_KEY;

  private readonly sessionState = signal<AuthSession | null>(null);

  readonly session = this.sessionState.asReadonly();
  readonly isSignedIn = computed(() => {
    const session = this.sessionState();
    return session !== null && !this.isExpired(session);
  });
  readonly currentUserId = computed(() => this.sessionState()?.userId ?? null);
  readonly currentUserEmail = computed(() => this.sessionState()?.email ?? null);
  readonly currentUserRoles = computed<readonly string[]>(() => this.sessionState()?.roles ?? []);
  readonly currentRole = computed<string | null>(() => {
    const roles = this.currentUserRoles();
    return roles.length > 0 ? roles[0] : null;
  });

  constructor() {
    this.hydrateSession();
  }

  registerCleanup(callback: () => void): void {
    this.cleanupCallbacks.add(callback);
  }

  isExpired(session: AuthSession): boolean {
    return session.expiresAt <= Date.now();
  }

  establishSession(response: SignInResponse, email: string): AuthSession {
    if (!response || typeof response.accessToken !== 'string' || response.accessToken.trim() === '') {
      throw new Error('INVALID_SIGN_IN_RESPONSE');
    }
    if (typeof response.tokenType !== 'string' || response.tokenType.trim() === '') {
      throw new Error('INVALID_SIGN_IN_RESPONSE');
    }
    if (typeof response.expiresIn !== 'number' || !Number.isFinite(response.expiresIn)) {
      throw new Error('INVALID_SIGN_IN_RESPONSE');
    }
    if (!response.user || typeof response.user.id !== 'number' || !Number.isFinite(response.user.id)) {
      throw new Error('INVALID_SIGN_IN_RESPONSE');
    }
    if (typeof response.user.email !== 'string' || response.user.email.trim() === '') {
      throw new Error('INVALID_SIGN_IN_RESPONSE');
    }
    if (!Array.isArray(response.user.roles)) {
      throw new Error('INVALID_SIGN_IN_RESPONSE');
    }

    const payload = JwtDecoder.decode(response.accessToken);
    const userId = Number(payload.sub);
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new Error('INVALID_JWT_SUBJECT');
    }
    if (userId !== response.user.id) {
      throw new Error('INCONSISTENT_SIGN_IN_RESPONSE');
    }

    const expiresAt = typeof payload.exp === 'number'
      ? payload.exp * 1000
      : Date.now() + response.expiresIn * 1000;

    if (expiresAt <= Date.now()) {
      throw new Error('EXPIRED_JWT');
    }

    const session: AuthSession = {
      userId: response.user.id,
      email: response.user.email.trim(),
      accessToken: response.accessToken,
      tokenType: response.tokenType,
      expiresAt,
      roles: response.user.roles.map((role) => String(role || '').trim()).filter(Boolean),
    };

    this.sessionState.set(session);
    this.persistSession(session);
    return session;
  }

  currentUser(): User | null {
    const session = this.sessionState();
    if (!session || this.isExpired(session)) return null;
    return UserAssembler.toEntityFromSummary({
      id: session.userId,
      email: session.email,
      roles: [...session.roles],
      active: true,
    });
  }

  hasRole(roleName: string): boolean {
    const expected = this.normalizeRoleName(roleName);
    if (!expected) return false;
    return this.sessionState()?.roles
      .map((role) => this.normalizeRoleName(role))
      .filter((role): role is string => role !== null)
      .includes(expected) ?? false;
  }

  hasAnyRole(allowedRoles: readonly string[]): boolean {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const roles = this.sessionState()?.roles ?? [];
    if (roles.length === 0) return false;
    return allowedRoles.some((role) => this.hasRole(role));
  }

  signOut(): void {
    this.sessionState.set(null);
    this.clearPersistedSession();
    const iamStore = this.injector.get(IamStore, null, {optional: true});
    iamStore?.clearSession();
    this.cleanupCallbacks.forEach((callback) => callback());
  }

  private hydrateSession(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<PersistedAuthSession>;
      if (
        typeof parsed?.userId !== 'number' ||
        !Number.isFinite(parsed.userId) ||
        parsed.userId <= 0 ||
        typeof parsed?.email !== 'string' ||
        parsed.email.trim() === '' ||
        typeof parsed?.accessToken !== 'string' ||
        parsed.accessToken.trim() === '' ||
        typeof parsed?.tokenType !== 'string' ||
        parsed.tokenType.trim() === '' ||
        typeof parsed?.expiresAt !== 'number' ||
        !Number.isFinite(parsed.expiresAt) ||
        !Array.isArray(parsed.roles)
      ) {
        this.clearPersistedSession();
        return;
      }

      const session: AuthSession = {
        userId: parsed.userId,
        email: parsed.email.trim(),
        accessToken: parsed.accessToken,
        tokenType: parsed.tokenType,
        expiresAt: parsed.expiresAt,
        roles: parsed.roles.map((role) => String(role || '').trim()).filter(Boolean),
      };

      if (this.isExpired(session)) {
        this.clearPersistedSession();
        return;
      }

      try {
        const payload = JwtDecoder.decode(session.accessToken);
        if (Number(payload.sub) !== session.userId) {
          this.clearPersistedSession();
          return;
        }
      } catch {
        this.clearPersistedSession();
        return;
      }

      this.sessionState.set(session);
    } catch {
      this.clearPersistedSession();
    }
  }

  private persistSession(session: AuthSession): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const payload: PersistedAuthSession = {
        userId: session.userId,
        email: session.email,
        accessToken: session.accessToken,
        tokenType: session.tokenType,
        expiresAt: session.expiresAt,
        roles: [...session.roles],
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors.
    }
  }

  private clearPersistedSession(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore storage removal errors.
    }
  }

  private normalizeRoleName(rawRole: string | undefined | null): string | null {
    if (!rawRole) return null;
    const normalized = rawRole.trim();
    return normalized.length > 0 ? normalized.toUpperCase() : null;
  }
}
