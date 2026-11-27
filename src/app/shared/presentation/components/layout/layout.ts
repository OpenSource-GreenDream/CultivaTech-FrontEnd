import {Component, computed, inject, signal} from '@angular/core';
import {AuthService} from '../../../../iam/application/auth.service';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {LanguageSwitcher} from '../language-switcher/language-switcher';
import {NotificationStore} from '../../../../notification/application/notification.store';
import {canAccessAgriculturalModules, canAccessNotifications} from '../../../../shared/domain/access-policy';

@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LanguageSwitcher,
    TranslatePipe
  ],
  selector: 'app-layout',
  styleUrl: './layout.css',
  templateUrl: './layout.html',
})
export class Layout {
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private readonly notificationStore = inject(NotificationStore);

  readonly unreadNotifications = this.notificationStore.unreadCount;
  readonly sidebarOpen = signal(false);
  readonly canAccessAgricultural = computed(() => canAccessAgriculturalModules(this.authService.currentUserRoles()));
  readonly canAccessNotifications = computed(() => canAccessNotifications(this.authService.currentUserRoles()));

  pageTitle: string = 'CultivaTech';

  toggleSidebar(): void {
    this.sidebarOpen.update((value) => !value);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  onSignOut(): void {
    this.authService.signOut();
    this.router.navigate(['/sign-in']);
  }
}