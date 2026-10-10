import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { ReadingPassage } from '../../models/reading/reading.models';

@Injectable({ providedIn: 'root' })
export class ReadingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/reading`;

  forLesson(lessonId: string): Observable<ReadingPassage[]> {
    return this.http.get<ReadingPassage[]>(`${this.base}/lesson/${lessonId}`);
  }
}