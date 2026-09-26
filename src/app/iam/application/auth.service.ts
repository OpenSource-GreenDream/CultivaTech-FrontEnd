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

  signOut(): void {
    this.currentUser.set(null);
  }
}
