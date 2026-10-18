import { Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toApiError } from '../../core/models/api-error.model';
import { showError, strongPassword } from '../../shared/validators/password.validator';
import { AuthStore } from '../../state/auth/auth.store';
import { PasswordFieldComponent } from '../../components/auth/password-field.component';

@Component({
  selector: 'dm-profile-page',
  imports: [ReactiveFormsModule, PasswordFieldComponent],
  template: `
    <section class="page">
      <p class="eyebrow">Account</p>
      <h1 class="hello">Your profile</h1>

      <div class="grid-2">
        <article class="card">
          <h2 style="font-size: 1.6rem; margin-bottom: 1rem">Details</h2>

          @if (profileMessage()) {
            <div class="alert" [class.alert-success]="!profileFailed()" [class.alert-error]="profileFailed()" role="status">{{ profileMessage() }}</div>
          }

          <form class="stack" [formGroup]="profileForm" (ngSubmit)="saveProfile()" novalidate>
            <div class="field">
              <label for="fullName">Full name</label>
              <input id="fullName" class="input" type="text" formControlName="fullName" autocomplete="name" [class.invalid]="show(profileForm.controls.fullName)" />
              @if (show(profileForm.controls.fullName)) {
                <span class="field-error">Enter your full name.</span>
              }
            </div>

            <div class="field">
              <label for="email">Email</label>
              <input id="email" class="input" type="email" [value]="store.user()?.email ?? ''" disabled />
            </div>

            <p class="muted">Current level: <strong>{{ store.user()?.currentLevel }}</strong></p>

            <button class="btn btn-dark" type="submit" [disabled]="savingProfile()">
              {{ savingProfile() ? 'Saving...' : 'Save changes' }}
            </button>
          </form>
        </article>

        <article class="card">
          <h2 style="font-size: 1.6rem; margin-bottom: 1rem">{{ hasPassword() ? 'Change password' : 'Set a password' }}</h2>

          @if (passwordMessage()) {
            <div class="alert" [class.alert-success]="!passwordFailed()" [class.alert-error]="passwordFailed()" role="status">{{ passwordMessage() }}</div>
          }

          <form class="stack" [formGroup]="passwordForm" (ngSubmit)="savePassword()" novalidate>
            @if (hasPassword()) {
              <div class="field">
                <label for="currentPassword">Current password</label>
                <dm-password-field inputId="currentPassword" formControlName="currentPassword" autocomplete="current-password" />
              </div>
            }

            <div class="field">
              <label for="newPassword">New password</label>
              <dm-password-field inputId="newPassword" formControlName="newPassword" autocomplete="new-password" placeholder="At least 8 characters" [invalid]="show(passwordForm.controls.newPassword)" />
              @if (show(passwordForm.controls.newPassword)) {
                <span class="field-error">Use at least 8 characters with a letter and a number.</span>
              }
            </div>

            <button class="btn btn-dark" type="submit" [disabled]="savingPassword()">
              {{ savingPassword() ? 'Saving...' : 'Update password' }}
            </button>
          </form>
        </article>
      </div>

      <button class="btn btn-outline" type="button" (click)="store.signOut()">Sign out</button>
    </section>
  `
})
export class ProfilePage {
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly store = inject(AuthStore);

  protected readonly show = showError;
  protected readonly hasPassword = computed(() => this.store.user()?.hasPassword ?? false);

  protected readonly savingProfile = signal(false);
  protected readonly profileMessage = signal<string | null>(null);
  protected readonly profileFailed = signal(false);

  protected readonly savingPassword = signal(false);
  protected readonly passwordMessage = signal<string | null>(null);
  protected readonly passwordFailed = signal(false);

  protected readonly profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
  });

  protected readonly passwordForm = this.fb.group({
    currentPassword: [''],
    newPassword: ['', [Validators.required, strongPassword]]
  });

  constructor() {
    effect(() => {
      const user = this.store.user();
      if (user && !this.profileForm.dirty) {
        this.profileForm.controls.fullName.setValue(user.fullName, { emitEvent: false });
      }
    });
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile.set(true);
    this.profileMessage.set(null);

    this.store.updateProfile(this.profileForm.controls.fullName.value).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.profileFailed.set(false);
        this.profileMessage.set('Profile updated.');
        this.profileForm.markAsPristine();
      },
      error: (e: unknown) => {
        this.savingProfile.set(false);
        this.profileFailed.set(true);
        this.profileMessage.set(toApiError(e).message);
      }
    });
  }

  protected savePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword.set(true);
    this.passwordMessage.set(null);
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.store.changePassword(this.hasPassword() ? currentPassword : null, newPassword).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordFailed.set(false);
        this.passwordMessage.set('Password updated. Other devices were signed out.');
        this.passwordForm.reset({ currentPassword: '', newPassword: '' });
      },
      error: (e: unknown) => {
        this.savingPassword.set(false);
        this.passwordFailed.set(true);
        this.passwordMessage.set(toApiError(e).message);
      }
    });
  }
}