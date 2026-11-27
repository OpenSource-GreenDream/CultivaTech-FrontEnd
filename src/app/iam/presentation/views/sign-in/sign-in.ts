import {Component, inject, signal} from '@angular/core';
import {IamStore} from '../../../application/iam.store';
import {Router} from '@angular/router';
import {SignIn as SignInModel} from '../../../domain/model/sign-in.model';
import {AuthService} from '../../../application/auth.service';
import {SignInForm} from '../../components/sign-in-form/sign-in-form';
import {TranslatePipe} from '@ngx-translate/core';
import {LanguageSwitcher} from '../../../../shared/presentation/components/language-switcher/language-switcher';

@Component({
  imports: [
    SignInForm,
    TranslatePipe,
    LanguageSwitcher
  ],
  selector: 'app-sign-in',
  styleUrl: './sign-in.css',
  templateUrl: './sign-in.html',
})
export class SignIn {
  private iamStore = inject(IamStore);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  onSignIn(request: SignInModel) {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isSubmitting.set(true);
    this.iamStore.signIn(request).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        if (this.authService.isSignedIn()) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set('sign-in.form.error-credentials');
        }
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('sign-in.form.error-credentials');
      }
    });
  }

  onNavigateToSignUp() {
    this.router.navigate(['/sign-up']);
  }
}