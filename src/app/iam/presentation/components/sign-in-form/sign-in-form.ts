import {Component, output} from '@angular/core';
import {SignInRequest} from '../../../domain/model/sign-in.request';
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
  submitForm = output<SignInRequest>();
  navigateToSignUp = output<void>();

  signInForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.signInForm = this.fb.group({
      emailAddress: ['', [Validators.required, Validators.email]],
      password_hash: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.signInForm.valid) {
      this.submitForm.emit(this.signInForm.value);
    } else {
      this.signInForm.markAllAsTouched();
    }
  }

  onSignUpClick() {
    this.navigateToSignUp.emit();
  }
}
