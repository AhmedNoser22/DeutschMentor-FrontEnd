import { AbstractControl, ValidationErrors } from '@angular/forms';

export function strongPassword(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (!value) {
    return null;
  }
  const valid = value.length >= 8 && value.length <= 128 && /\p{L}/u.test(value) && /\d/.test(value);
  return valid ? null : { weakPassword: true };
}

export function showError(control: AbstractControl): boolean {
  return control.invalid && (control.touched || control.dirty);
}