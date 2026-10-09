import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../components/auth/auth-layout.component';
import { toApiError } from '../../core/models/api-error.model';
import { showError } from '../../shared/validators/password.validator';
import { AuthStore } from '../../state/auth/auth.store';

@Component({
  selector: 'dm-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  template: `
    <dm-auth-layout [showTabs]="false">
      <h2 class="auth-title">Reset your password</h2>
      <p class="muted" style="margin-bottom: 1.25rem">Enter your email and we will send you a 6-digit code.</p>

      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }

      <form class="stack" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" class="input" type="email" formControlName="email" autocomplete="email" inputmode="email" placeholder="you@example.com" [class.invalid]="show(form.controls.email)" />
          @if (show(form.controls.email)) {
            <span class="field-error">Enter a valid email address.</span>
          }
        </div>

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          {{ loading() ? 'Sending...' : 'Send code' }}
        </button>
      </form>

      <p class="center-row"><a class="link" routerLink="/auth/sign-in">Back to sign in</a></p>
    </dm-auth-layout>
  `
})
export class ForgotPasswordPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly show = showError;
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    const { email } = this.form.getRawValue();

    this.store.forgotPassword({ email }).subscribe({
      next: () => void this.router.navigate(['/auth/reset-password'], { queryParams: { email } }),
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }
}