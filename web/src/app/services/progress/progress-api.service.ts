import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { Achievement, Today } from '../../models/progress/progress.models';

@Injectable({ providedIn: 'root' })
export class ProgressApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/progress`;

  today(): Observable<Today> {
    return this.http.get<Today>(`${this.base}/today`);
  }

  achievements(): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.base}/achievements`);
  }
}