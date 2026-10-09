import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../components/auth/auth-layout.component';
import { toApiError } from '../../core/models/api-error.model';
import { showError, strongPassword } from '../../shared/validators/password.validator';
import { AuthStore } from '../../state/auth/auth.store';

@Component({
  selector: 'dm-reset-password-page',
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  template: `
    <dm-auth-layout [showTabs]="false">
      <h2 class="auth-title">Choose a new password</h2>

      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }
      @if (info()) {
        <div class="alert alert-success" role="status">{{ info() }}</div>
      }

      <form class="stack" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" class="input" type="email" formControlName="email" autocomplete="email" inputmode="email" [class.invalid]="show(form.controls.email)" />
          @if (show(form.controls.email)) {
            <span class="field-error">Enter a valid email address.</span>
          }
        </div>

        <div class="field">
          <label for="code">Code from your email</label>
          <input id="code" class="input code-input" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" formControlName="code" [class.invalid]="show(form.controls.code)" />
          @if (show(form.controls.code)) {
            <span class="field-error">Enter the 6-digit code.</span>
          }
        </div>

        <div class="field">
          <label for="newPassword">New password</label>
          <input id="newPassword" class="input" type="password" formControlName="newPassword" autocomplete="new-password" placeholder="At least 8 characters" [class.invalid]="show(form.controls.newPassword)" />
          @if (show(form.controls.newPassword)) {
            <span class="field-error">Use at least 8 characters with a letter and a number.</span>
          }
        </div>

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          {{ loading() ? 'Saving...' : 'Update password' }}
        </button>
        <button class="btn btn-outline btn-block" type="button" [disabled]="resending()" (click)="resend()">Send a new code</button>
      </form>

      <p class="center-row"><a class="link" routerLink="/auth/sign-in">Back to sign in</a></p>
    </dm-auth-layout>
  `
})
export class ResetPasswordPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly show = showError;
  protected readonly loading = signal(false);
  protected readonly resending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    newPassword: ['', [Validators.required, strongPassword]]
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.info.set(null);

    this.store.resetPassword(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigate(['/auth/sign-in'], { queryParams: { reset: 1 } }),
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  protected resend(): void {
    const email = this.form.controls.email;
    if (email.invalid) {
      email.markAsTouched();
      return;
    }

    this.resending.set(true);
    this.error.set(null);

    this.store.forgotPassword({ email: email.value }).subscribe({
      next: () => {
        this.resending.set(false);
        this.info.set('If this email is registered, a new code is on its way.');
      },
      error: (e: unknown) => {
        this.resending.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }
}