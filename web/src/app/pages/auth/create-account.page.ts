import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../components/auth/auth-layout.component';
import { GoogleButtonComponent } from '../../components/auth/google-button.component';
import { toApiError } from '../../core/models/api-error.model';
import { StartPreference } from '../../domain/enums/user.enums';
import { showError, strongPassword } from '../../shared/validators/password.validator';
import { AuthStore } from '../../state/auth/auth.store';
import { PasswordFieldComponent } from '../../components/auth/password-field.component';

@Component({
  selector: 'dm-create-account-page',
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent, GoogleButtonComponent, PasswordFieldComponent],
  template: `
    <dm-auth-layout>
      <h2 class="auth-title">Create your account</h2>

      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
          @if (emailTaken()) {
            <a class="link" routerLink="/auth/sign-in">Sign in instead</a>
          }
        </div>
      }

      <form class="stack" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="fullName">Full name</label>
          <input id="fullName" class="input" type="text" formControlName="fullName" autocomplete="name" placeholder="Your Name" [class.invalid]="show(form.controls.fullName)" />
          @if (show(form.controls.fullName)) {
            <span class="field-error">Enter your full name.</span>
          }
        </div>

        <div class="field">
          <label for="email">Email</label>
          <input id="email" class="input" type="email" formControlName="email" autocomplete="email" inputmode="email" placeholder="you@example.com" [class.invalid]="show(form.controls.email)" />
          @if (show(form.controls.email)) {
            <span class="field-error">Enter a valid email address.</span>
          }
        </div>

        <div class="field">
          <label for="password">Password</label>
         <dm-password-field inputId="password" formControlName="password" autocomplete="new-password" placeholder="At least 8 characters" [invalid]="show(form.controls.password)" />
          @if (show(form.controls.password)) {
            <span class="field-error">Use at least 8 characters with a letter and a number.</span>
          }
        </div>

        <fieldset class="choices">
          <legend>Where do you want to start?</legend>
          <label class="choice">
            <input type="radio" formControlName="startPreference" [value]="StartPreference.StartAtA1" />
            <span>
              <strong>Start at A1</strong>
              <small>Complete beginner. Lesson 1 opens right away.</small>
            </span>
          </label>
          <label class="choice">
            <input type="radio" formControlName="startPreference" [value]="StartPreference.PlacementTest" />
            <span>
              <strong>Take the placement test</strong>
              <small>About 15 minutes. You begin at the level your answers show.</small>
            </span>
          </label>
        </fieldset>

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          {{ loading() ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <div class="divider"><span>or</span></div>
      <dm-google-button [text]="'signup_with'" (credential)="onGoogle($event)" />
    </dm-auth-layout>
  `
})
export class CreateAccountPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly StartPreference = StartPreference;
  protected readonly show = showError;
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly emailTaken = signal(false);

  protected readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, strongPassword]],
    startPreference: [StartPreference.StartAtA1]
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.emailTaken.set(false);

    this.store.register(this.form.getRawValue()).subscribe({
      next: (response) =>
        void this.router.navigate(['/auth/confirm-email'], {
          queryParams: { email: response.email },
          state: { cooldown: response.resendCooldownSeconds }
        }),
      error: (e: unknown) => {
        this.loading.set(false);
        const error = toApiError(e);

        if (error.code === 'resend_too_soon') {
          void this.router.navigate(['/auth/confirm-email'], {
            queryParams: { email: this.form.controls.email.value }
          });
          return;
        }

        this.emailTaken.set(error.code === 'email_taken');
        this.error.set(error.message);
      }
    });
  }

  protected onGoogle(idToken: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.store
      .signInWithGoogle({ idToken, startPreference: this.form.controls.startPreference.value })
      .subscribe({
        next: () => void this.router.navigate(['/today']),
        error: (e: unknown) => {
          this.loading.set(false);
          this.error.set(toApiError(e).message);
        }
      });
  }
}