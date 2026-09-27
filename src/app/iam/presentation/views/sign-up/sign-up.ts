import {Component, inject} from '@angular/core';
import {IamStore} from '../../../application/iam.store';
import {Router} from '@angular/router';
import {SignUpRequest} from '../../../domain/model/sign-up.request';
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

  onSignUp(request: SignUpRequest) {
    this.iamStore.signUp(request).subscribe({
      next: () => {
        this.router.navigate(['/sign-in']);
      },
      error: (err) => {
        console.error('Error durante el registro', err);
      }
    });
  }

  onNavigateToSignIn() {
    this.router.navigate(['/sign-in']);
  }
}
