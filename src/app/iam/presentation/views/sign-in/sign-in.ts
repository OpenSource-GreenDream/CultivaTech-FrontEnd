import {Component, inject, signal} from '@angular/core';
import {IamStore} from '../../../application/iam.store';
import {Router} from '@angular/router';
import {SignInRequest} from '../../../infrastructure/sign-in.request';
import {SignInForm} from '../../components/sign-in-form/sign-in-form';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  imports: [
    SignInForm,
    TranslatePipe
  ],
  selector: 'app-sign-in',
  styleUrl: './sign-in.css',
  templateUrl: './sign-in.html',
})
export class SignIn {
  private iamStore = inject(IamStore);
  private router = inject(Router);

  readonly errorMessage = signal<string | null>(null);

  onSignIn(request: SignInRequest) {
    this.errorMessage.set(null);
    this.iamStore.signIn(request).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.errorMessage.set('sign-in.form.error-credentials');
      }
    });
  }

  onNavigateToSignUp() {
    this.router.navigate(['/sign-up']);
  }
}
