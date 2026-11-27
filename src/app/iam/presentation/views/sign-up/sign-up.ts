import {Component, inject, signal} from '@angular/core';
import {IamStore} from '../../../application/iam.store';
import {Router} from '@angular/router';
import {SignUp as SignUpModel} from '../../../domain/model/sign-up.model';
import {SignUpForm} from '../../components/sign-up-form/sign-up-form';
import {TranslatePipe} from '@ngx-translate/core';
import {LanguageSwitcher} from '../../../../shared/presentation/components/language-switcher/language-switcher';

@Component({
  imports: [
    SignUpForm,
    TranslatePipe,
    LanguageSwitcher
  ],
  selector: 'app-sign-up',
  styleUrl: './sign-up.css',
  templateUrl: './sign-up.html',
})
export class SignUp {
  private iamStore = inject(IamStore);
  private router = inject(Router);

  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  onSignUp(request: SignUpModel) {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isSubmitting.set(true);

    const normalizedRole = request.role.trim().toUpperCase();
    if (!['FARMER', 'CUSTOMER', 'SUPPLIER'].includes(normalizedRole)) {
      this.isSubmitting.set(false);
      this.errorMessage.set('sign-up.form.error-role-unsupported');
      return;
    }

    this.iamStore.signUp(request).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('sign-up.form.success');
        this.router.navigate(['/sign-in']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set('sign-up.form.error-submit');
      }
    });
  }

  onNavigateToSignIn() {
    this.router.navigate(['/sign-in']);
  }
}