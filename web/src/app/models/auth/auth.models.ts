import { StartPreference } from '../../domain/enums/user.enums';
import { User } from '../../domain/models/user.model';

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  startPreference: StartPreference;
}

export interface ConfirmEmailRequest {
  email: string;
  code: string;
}

export interface ResendCodeRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
  startPreference?: StartPreference;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  fullName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string | null;
  newPassword: string;
  currentRefreshToken: string | null;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  user: User;
}

export interface PendingRegistrationResponse {
  email: string;
  codeExpiresInSeconds: number;
  resendCooldownSeconds: number;
}