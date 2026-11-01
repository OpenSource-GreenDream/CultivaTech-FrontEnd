import {Component, inject, output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {SignUpRequest} from '../../../infrastructure/sign-up.request';
import {TranslatePipe} from '@ngx-translate/core';
import {ROLE_DEFINITIONS, USER_ROLES} from '../../../domain/model/iam.constants';

@Component({
  imports: [
    ReactiveFormsModule,
    TranslatePipe
  ],
  selector: 'app-sign-up-form',
  styleUrl: './sign-up-form.css',
  templateUrl: './sign-up-form.html',
})
export class SignUpForm {
  private fb = inject(FormBuilder);

  submitForm = output<SignUpRequest>();
  navigateToSignIn = output<void>();

  rolesList = [
    { value: ROLE_DEFINITIONS[USER_ROLES.AGRICULTOR].name, labelKey: 'sign-up.role-options.agricultor' },
    { value: ROLE_DEFINITIONS[USER_ROLES.PROVEEDOR].name, labelKey: 'sign-up.role-options.proveedor' },
    { value: ROLE_DEFINITIONS[USER_ROLES.CLIENTEB2B].name, labelKey: 'sign-up.role-options.clienteb2b' },
  ];

  signUpForm: FormGroup = this.fb.group({
    emailAddress: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    role: [ROLE_DEFINITIONS[USER_ROLES.AGRICULTOR].name, [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  private passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.signUpForm.valid) {
      const { emailAddress, password, role } = this.signUpForm.value;
      this.submitForm.emit({ email_address: emailAddress, password, role });
    } else {
      this.signUpForm.markAllAsTouched();
    }
  }

  onSignInClick() {
    this.navigateToSignIn.emit();
  }
}
