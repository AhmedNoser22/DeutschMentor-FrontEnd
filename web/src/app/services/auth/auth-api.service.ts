import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import {
  AuthResponse,
  ConfirmEmailRequest,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  LogoutRequest,
  PendingRegistrationResponse,
  RefreshRequest,
  RegisterRequest,
  ResendCodeRequest,
  ResetPasswordRequest
} from '../../models/auth/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/auth`;

  register(body: RegisterRequest): Observable<PendingRegistrationResponse> {
    return this.http.post<PendingRegistrationResponse>(`${this.base}/register`, body);
  }

  confirmEmail(body: ConfirmEmailRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/confirm-email`, body);
  }

  resendCode(body: ResendCodeRequest): Observable<PendingRegistrationResponse> {
    return this.http.post<PendingRegistrationResponse>(`${this.base}/resend-code`, body);
  }

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, body);
  }

  google(body: GoogleLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/google`, body);
  }

  refresh(body: RefreshRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/refresh`, body);
  }

  logout(body: LogoutRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, body);
  }

  forgotPassword(body: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/forgot-password`, body);
  }

  resetPassword(body: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/reset-password`, body);
  }
}