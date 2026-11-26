import {Component, computed, inject, OnInit, output, input, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {SignUp} from '../../../domain/model/sign-up.model';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {IamStore} from '../../../application/iam.store';
import {
  nonBlankEmailValidator,
  nonBlankValidator,
} from '../../../../shared/domain/validators/form.validators';

interface RoleOption {
  value: string;
  label: string;
  disabled: boolean;
}

@Component({
  imports: [
    ReactiveFormsModule,
    TranslatePipe
  ],
  selector: 'app-sign-up-form',
  styleUrl: './sign-up-form.css',
  templateUrl: './sign-up-form.html',
})
export class SignUpForm implements OnInit {
  private fb = inject(FormBuilder);
  private iamStore = inject(IamStore);
  private translate = inject(TranslateService);
  private readonly languageTick = signal(0);

  submitForm = output<SignUp>();
  navigateToSignIn = output<void>();

  readonly isSubmitting = input(false);
  readonly rolesLoading = this.iamStore.rolesLoading;
  readonly rolesError = this.iamStore.rolesError;

  readonly rolesList = computed<RoleOption[]>(() => {
    this.languageTick();
    return this.iamStore.roles()
      .filter((role) => role.name.trim().toUpperCase() !== 'ADMIN')
      .map((role) => {
        const translationKey = `sign-up.role-options.${role.name.trim().toLowerCase()}`;
        const translatedLabel = this.translate.instant(translationKey);
        return {
          value: role.name,
          label: translatedLabel === translationKey
            ? this.humanizeRoleName(role.name)
            : translatedLabel,
          disabled: false,
        };
      });
  });

  signUpForm: FormGroup = this.fb.group({
    emailAddress: ['', [nonBlankEmailValidator]],
    password: ['', [nonBlankValidator, Validators.minLength(8), Validators.maxLength(128)]],
    confirmPassword: ['', [nonBlankValidator]],
    role: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  constructor() {
    this.translate.onLangChange.subscribe(() => {
      this.languageTick.update((value) => value + 1);
    });
  }

  ngOnInit(): void {
    this.iamStore.loadRoles().subscribe((roles) => {
      const farmer = roles.find((role) => role.name.trim().toUpperCase() === 'FARMER');
      if (farmer && !this.signUpForm.get('role')?.value) {
        this.signUpForm.patchValue({ role: farmer.name });
      }
    });
  }

  private passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  private humanizeRoleName(name: string): string {
    return name
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  onSubmit() {
    if (this.signUpForm.valid) {
      const { emailAddress, password, role } = this.signUpForm.value;
      this.submitForm.emit({
        email: String(emailAddress).trim(),
        password,
        role,
      });
    } else {
      this.signUpForm.markAllAsTouched();
    }
  }

  onSignInClick() {
    this.navigateToSignIn.emit();
  }
}
