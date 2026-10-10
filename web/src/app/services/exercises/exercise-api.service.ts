import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { AnswerResult, ExerciseSet } from '../../models/exercises/exercise.models';

@Injectable({ providedIn: 'root' })
export class ExerciseApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/exercises`;

  forLesson(lessonId: string): Observable<ExerciseSet> {
    return this.http.get<ExerciseSet>(`${this.base}/lesson/${lessonId}`);
  }

  submit(exerciseId: string, answer: string[]): Observable<AnswerResult> {
    return this.http.post<AnswerResult>(`${this.base}/${exerciseId}/answer`, { answer });
  }
}