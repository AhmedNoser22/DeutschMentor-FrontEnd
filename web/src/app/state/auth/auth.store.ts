import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, map, Observable, shareReplay, tap, throwError } from 'rxjs';
import { StorageService } from '../../core/services/storage.service';
import { UserRole } from '../../domain/enums/user.enums';
import { User } from '../../domain/models/user.model';
import {
  AuthResponse,
  ConfirmEmailRequest,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  PendingRegistrationResponse,
  RegisterRequest,
  ResendCodeRequest,
  ResetPasswordRequest
} from '../../models/auth/auth.models';
import { AccountApiService } from '../../services/auth/account-api.service';
import { AuthApiService } from '../../services/auth/auth-api.service';
import { LearningStore } from '../learning/learning.store';

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

const SESSION_KEY = 'session';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApiService);
  private readonly accountApi = inject(AccountApiService);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);
  private readonly learning = inject(LearningStore);

  private readonly session = signal<StoredSession | null>(this.readSession());
  private refreshRequest$?: Observable<string>;

  readonly user = computed(() => this.session()?.user ?? null);
  readonly accessToken = computed(() => this.session()?.accessToken ?? null);
  readonly refreshToken = computed(() => this.session()?.refreshToken ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.user()?.role === UserRole.Admin);
  readonly initials = computed(() =>
    (this.user()?.fullName ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
  );

  register(body: RegisterRequest): Observable<PendingRegistrationResponse> {
    return this.api.register(body);
  }

  resendCode(body: ResendCodeRequest): Observable<PendingRegistrationResponse> {
    return this.api.resendCode(body);
  }

  confirmEmail(body: ConfirmEmailRequest): Observable<AuthResponse> {
    return this.api.confirmEmail(body).pipe(tap((response) => this.setSession(response)));
  }

  signIn(body: LoginRequest): Observable<AuthResponse> {
    return this.api.login(body).pipe(tap((response) => this.setSession(response)));
  }

  signInWithGoogle(body: GoogleLoginRequest): Observable<AuthResponse> {
    return this.api.google(body).pipe(tap((response) => this.setSession(response)));
  }

  forgotPassword(body: ForgotPasswordRequest): Observable<void> {
    return this.api.forgotPassword(body);
  }

  resetPassword(body: ResetPasswordRequest): Observable<void> {
    return this.api.resetPassword(body);
  }

  refreshSession(): Observable<string> {
    if (!this.refreshRequest$) {
      const token = this.refreshToken();
      if (!token) {
        return throwError(() => new Error('No refresh token.'));
      }

      this.refreshRequest$ = this.api.refresh({ refreshToken: token }).pipe(
        tap((response) => this.setSession(response)),
        map((response) => response.accessToken),
        finalize(() => (this.refreshRequest$ = undefined)),
        shareReplay(1)
      );
    }

    return this.refreshRequest$;
  }

  loadProfile(): Observable<User> {
    return this.accountApi.me().pipe(tap((user) => this.patchUser(user)));
  }

  updateProfile(fullName: string): Observable<User> {
    return this.accountApi.updateMe({ fullName }).pipe(tap((user) => this.patchUser(user)));
  }

  changePassword(currentPassword: string | null, newPassword: string): Observable<void> {
    return this.accountApi
      .changePassword({ currentPassword, newPassword, currentRefreshToken: this.refreshToken() })
      .pipe(tap(() => this.patchUser({ hasPassword: true })));
  }

  signOut(): void {
    const token = this.refreshToken();
    this.clearSession();
    if (token) {
      this.api.logout({ refreshToken: token }).subscribe({ error: () => undefined });
    }
    void this.router.navigate(['/auth/sign-in']);
  }

  clearSession(): void {
    this.session.set(null);
    this.storage.remove(SESSION_KEY);
    this.learning.reset();
  }

  private setSession(response: AuthResponse): void {
    const session: StoredSession = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user
    };
    this.session.set(session);
    this.storage.set(SESSION_KEY, JSON.stringify(session));
  }

  private patchUser(patch: Partial<User>): void {
    const current = this.session();
    if (!current) {
      return;
    }
    const next: StoredSession = { ...current, user: { ...current.user, ...patch } };
    this.session.set(next);
    this.storage.set(SESSION_KEY, JSON.stringify(next));
  }

  private readSession(): StoredSession | null {
    const raw = this.storage.get(SESSION_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<StoredSession>;
      if (parsed.accessToken && parsed.refreshToken && parsed.user) {
        return parsed as StoredSession;
      }
    } catch {
      return null;
    }
    return null;
  }
}