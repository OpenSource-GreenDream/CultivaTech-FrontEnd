import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

/**
 * Shared form validators. They reject values that only contain whitespace,
 * which standard Angular validators treat as valid and would otherwise allow
 * blank records to reach the API.
 */
export function nonBlankValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || String(value).trim().length === 0) {
    return { required: true };
  }
  return null;
}

export function nonBlankEmailValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || String(value).trim().length === 0) {
    return { required: true };
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(String(value).trim()) ? null : { email: true };
}

export function trimmedMinLengthValidator(minLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || String(value).trim().length === 0) {
      return { required: true };
    }
    const actualLength = String(value).trim().length;
    return actualLength < minLength
      ? { minlength: { requiredLength: minLength, actualLength } }
      : null;
  };
}

export function positiveNumberValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || String(value).trim() === '') {
    return { required: true };
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? null : { positive: true };
}
