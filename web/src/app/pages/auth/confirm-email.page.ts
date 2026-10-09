import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { interval, Subscription, take } from 'rxjs';
import { AuthLayoutComponent } from '../../components/auth/auth-layout.component';
import { toApiError } from '../../core/models/api-error.model';
import { AuthStore } from '../../state/auth/auth.store';

@Component({
  selector: 'dm-confirm-email-page',
  imports: [ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  template: `
    <dm-auth-layout [showTabs]="false">
      <h2 class="auth-title">Check your email</h2>
      <p class="muted" style="margin-bottom: 1.25rem">
        We sent a 6-digit code to <strong>{{ email() }}</strong>. Enter it to finish creating your account.
      </p>

      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }
      @if (info()) {
        <div class="alert alert-success" role="status">{{ info() }}</div>
      }

      <div class="stack">
        <div class="field">
          <label for="code">Confirmation code</label>
          <input id="code" class="input code-input" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" [formControl]="code" (input)="onCodeInput($event)" />
        </div>

        <button class="btn btn-primary btn-block" type="button" [disabled]="loading() || code.invalid" (click)="verify()">
          {{ loading() ? 'Checking...' : 'Confirm email' }}
        </button>

        <button class="btn btn-outline btn-block" type="button" [disabled]="cooldown() > 0 || resending()" (click)="resend()">
          {{ cooldown() > 0 ? 'Send a new code in ' + cooldown() + 's' : 'Send a new code' }}
        </button>
      </div>

      <p class="center-row muted">Wrong email? <a class="link" routerLink="/auth/create-account">Start again</a></p>
    </dm-auth-layout>
  `
})
export class ConfirmEmailPage {
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private timer?: Subscription;

  protected readonly email = signal(this.route.snapshot.queryParamMap.get('email') ?? '');
  protected readonly code = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{6}$/)]
  });
  protected readonly loading = signal(false);
  protected readonly resending = signal(false);
  protected readonly cooldown = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);

  constructor() {
    if (!this.email()) {
      void this.router.navigate(['/auth/create-account']);
      return;
    }
    this.startCooldown(this.initialCooldown());
  }

  protected onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 6);
    if (digits !== input.value) {
      input.value = digits;
      this.code.setValue(digits);
    }
    if (digits.length === 6) {
      this.verify();
    }
  }

  protected verify(): void {
    if (this.code.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.info.set(null);

    this.store.confirmEmail({ email: this.email(), code: this.code.value }).subscribe({
      next: () => void this.router.navigate(['/today']),
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  protected resend(): void {
    this.resending.set(true);
    this.error.set(null);
    this.info.set(null);

    this.store.resendCode({ email: this.email() }).subscribe({
      next: (response) => {
        this.resending.set(false);
        this.info.set('A new code is on its way.');
        this.code.reset('');
        this.startCooldown(response.resendCooldownSeconds);
      },
      error: (e: unknown) => {
        this.resending.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  private startCooldown(seconds: number): void {
    this.timer?.unsubscribe();
    this.cooldown.set(seconds);
    if (seconds <= 0) {
      return;
    }
    this.timer = interval(1000)
      .pipe(take(seconds), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cooldown.update((value) => Math.max(0, value - 1)));
  }

  private initialCooldown(): number {
    const fromNavigation = this.router.getCurrentNavigation()?.extras.state?.['cooldown'] as number | undefined;
    const fromHistory = (history.state as { cooldown?: number } | null)?.cooldown;
    return fromNavigation ?? fromHistory ?? 0;
  }
}