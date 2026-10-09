import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { User } from '../../domain/models/user.model';
import { ChangePasswordRequest, UpdateProfileRequest } from '../../models/auth/auth.models';

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/account`;

  me(): Observable<User> {
    return this.http.get<User>(`${this.base}/me`);
  }

  updateMe(body: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.base}/me`, body);
  }

  changePassword(body: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/change-password`, body);
  }
}