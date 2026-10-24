import {Component, output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {SignUpRequest} from '../../../infrastructure/sign-up.request';
import {TranslatePipe} from '@ngx-translate/core';

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
  submitForm = output<SignUpRequest>();
  navigateToSignIn = output<void>();

  signUpForm: FormGroup;

  rolesList = [
    { value: 'agricultor', label: 'Agricultor' },
    { value: 'proveedor', label: 'Proveedor' },
    { value: 'clienteb2b', label: 'Cliente B2B' },
    { value: 'administrador', label: 'Administrador' }
  ];

  constructor(private fb: FormBuilder) {
    this.signUpForm = this.fb.group({
      emailAddress: ['', [Validators.required, Validators.email]],
      password_hash: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['agricultor', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(g: FormGroup) {
    const password = g.get('password_hash')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.signUpForm.valid) {
      const { emailAddress, password_hash, role } = this.signUpForm.value;
      this.submitForm.emit({ email_address: emailAddress, password_hash, role });
    } else {
      this.signUpForm.markAllAsTouched();
    }
  }

  onSignInClick() {
    this.navigateToSignIn.emit();
  }
}
