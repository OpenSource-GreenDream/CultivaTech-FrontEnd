import {Component, inject, signal} from '@angular/core';
import {IamStore} from '../../../application/iam.store';
import {Router} from '@angular/router';
import {SignUpRequest} from '../../../infrastructure/sign-up.request';
import {SignUpForm} from '../../components/sign-up-form/sign-up-form';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  imports: [
    SignUpForm,
    TranslatePipe
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

  onSignUp(request: SignUpRequest) {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isSubmitting.set(true);

    this.iamStore.signUp(request).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('sign-up.form.success');
        this.router.navigate(['/profile/create']);
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
