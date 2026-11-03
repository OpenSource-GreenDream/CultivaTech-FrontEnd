import {Component, inject, output} from '@angular/core';
import {SignInRequest} from '../../../infrastructure/sign-in.request';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  imports: [
    ReactiveFormsModule,
    TranslatePipe
  ],
  selector: 'app-sign-in-form',
  styleUrl: './sign-in-form.css',
  templateUrl: './sign-in-form.html',
})
export class SignInForm {
  private fb = inject(FormBuilder);

  submitForm = output<SignInRequest>();
  navigateToSignUp = output<void>();

  signInForm: FormGroup = this.fb.group({
    emailAddress: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onSubmit() {
    if (this.signInForm.valid) {
      const { emailAddress, password } = this.signInForm.value;
      this.submitForm.emit({ email: emailAddress, password });
    } else {
      this.signInForm.markAllAsTouched();
    }
  }

  onSignUpClick() {
    this.navigateToSignUp.emit();
  }
}
