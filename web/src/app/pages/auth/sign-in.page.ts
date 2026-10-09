import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../components/auth/auth-layout.component';
import { GoogleButtonComponent } from '../../components/auth/google-button.component';
import { ApiError, toApiError } from '../../core/models/api-error.model';
import { showError } from '../../shared/validators/password.validator';
import { AuthStore } from '../../state/auth/auth.store';

@Component({
  selector: 'dm-sign-in-page',
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent, GoogleButtonComponent],
  template: `
    <dm-auth-layout>
      <h2 class="auth-title">Welcome back</h2>

      @if (resetDone()) {
        <div class="alert alert-success" role="status">Password updated. Sign in with your new password.</div>
      }
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

        <div class="field">
          <label for="password">Password</label>
          <input id="password" class="input" type="password" formControlName="password" autocomplete="current-password" placeholder="Your password" [class.invalid]="show(form.controls.password)" />
          @if (show(form.controls.password)) {
            <span class="field-error">Enter your password.</span>
          }
        </div>

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          {{ loading() ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p class="center-row"><a class="link" routerLink="/auth/forgot-password">Forgot your password?</a></p>

      <div class="divider"><span>or</span></div>
      <dm-google-button [text]="'signin_with'" (credential)="onGoogle($event)" />
    </dm-auth-layout>
  `
})
export class SignInPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly show = showError;
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resetDone = signal(this.route.snapshot.queryParamMap.get('reset') === '1');

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.resetDone.set(false);
    const { email, password } = this.form.getRawValue();

    this.store.signIn({ email, password }).subscribe({
      next: () => void this.router.navigate(['/today']),
      error: (e: unknown) => this.fail(toApiError(e), email)
    });
  }

  protected onGoogle(idToken: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.store.signInWithGoogle({ idToken }).subscribe({
      next: () => void this.router.navigate(['/today']),
      error: (e: unknown) => this.fail(toApiError(e))
    });
  }

  private fail(error: ApiError, email?: string): void {
    this.loading.set(false);

    if (error.code === 'email_not_confirmed' && email) {
      void this.router.navigate(['/auth/confirm-email'], { queryParams: { email } });
      return;
    }

    this.error.set(error.message);
  }
}