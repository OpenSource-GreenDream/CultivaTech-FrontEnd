import {Component, inject, input, output} from '@angular/core';
import {SignInRequest} from '../../../infrastructure/sign-in.request';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';
import {
  nonBlankEmailValidator,
  nonBlankValidator,
} from '../../../../shared/domain/validators/form.validators';

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
  readonly isSubmitting = input(false);

  signInForm: FormGroup = this.fb.group({
    emailAddress: ['', [nonBlankEmailValidator]],
    password: ['', [nonBlankValidator]]
  });

  onSubmit() {
    if (this.signInForm.valid) {
      const { emailAddress, password } = this.signInForm.value;
      this.submitForm.emit({ email: String(emailAddress).trim(), password });
    } else {
      this.signInForm.markAllAsTouched();
    }
  }

  onSignUpClick() {
    this.navigateToSignUp.emit();
  }
}
