import {Component, inject} from '@angular/core';
import {IamStore} from '../../../application/iam.store';
import {Router} from '@angular/router';
import {SignInRequest} from '../../../domain/model/sign-in.request';
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

  onSignIn(request: SignInRequest) {
    this.iamStore.signIn(request).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error durante el inicio de sesión', err);
      }
    });
  }

  onNavigateToSignUp() {
    this.router.navigate(['/sign-up']);
  }
}
