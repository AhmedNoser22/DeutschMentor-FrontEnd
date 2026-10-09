import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { LessonStep } from '../../domain/enums/learning.enums';
import { CefrLevel } from '../../domain/enums/user.enums';
import {
  FinishLessonResponse,
  LessonDetail,
  LessonProgress,
  LevelDetail,
  LevelSummary
} from '../../models/learning/learning.models';

@Injectable({ providedIn: 'root' })
export class LearningApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/learning`;

  levels(): Observable<LevelSummary[]> {
    return this.http.get<LevelSummary[]>(`${this.base}/levels`);
  }

  level(code: CefrLevel): Observable<LevelDetail> {
    return this.http.get<LevelDetail>(`${this.base}/levels/${code}`);
  }

  lesson(id: string): Observable<LessonDetail> {
    return this.http.get<LessonDetail>(`${this.base}/lessons/${id}`);
  }

  markStep(id: string, step: LessonStep): Observable<LessonProgress> {
    return this.http.post<LessonProgress>(`${this.base}/lessons/${id}/steps/${step}`, {});
  }

  finish(id: string): Observable<FinishLessonResponse> {
    return this.http.post<FinishLessonResponse>(`${this.base}/lessons/${id}/finish`, {});
  }
}