import {Component, computed, inject, OnInit, output, input, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {SignUpRequest} from '../../../infrastructure/sign-up.request';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {IamStore} from '../../../application/iam.store';
import {
  nonBlankEmailValidator,
  nonBlankValidator,
} from '../../../../shared/domain/validators/form.validators';

interface RoleOption {
  value: string;
  label: string;
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

  submitForm = output<SignUpRequest>();
  navigateToSignIn = output<void>();

  readonly isSubmitting = input(false);
  readonly rolesLoading = this.iamStore.rolesLoading;
  readonly rolesError = this.iamStore.rolesError;

  readonly rolesList = computed<RoleOption[]>(() => {
    this.languageTick();
    return this.iamStore.roles().map((role) => {
      const normalizedName = role.name.trim().toLowerCase();
      const translationKey = `sign-up.role-options.${normalizedName}`;
      const translatedLabel = this.translate.instant(translationKey);
      return {
        value: role.name,
        label: translatedLabel === translationKey
          ? this.humanizeRoleName(role.name)
          : translatedLabel,
      };
    });
  });

  signUpForm: FormGroup = this.fb.group({
    emailAddress: ['', [nonBlankEmailValidator]],
    password: ['', [nonBlankValidator, Validators.minLength(6)]],
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
      if (roles.length > 0 && !this.signUpForm.get('role')?.value) {
        this.signUpForm.patchValue({ role: roles[0].name });
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
        email_address: String(emailAddress).trim(),
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
