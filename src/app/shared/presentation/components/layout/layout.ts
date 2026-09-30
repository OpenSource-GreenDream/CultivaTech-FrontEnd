import {Component, inject} from '@angular/core';
import {AuthService} from '../../../../iam/application/auth.service';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {SIGNAL} from '@angular/core/primitives/signals';
import {LanguageSwitcher} from '../language-switcher/language-switcher';

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

  pageTitle: string = 'CultivaTech';

  onSignOut(): void {
    this.authService.signOut();
    this.router.navigate(['/sign-in']);
  }
}
