import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { CefrLevel } from '../../domain/enums/user.enums';
import { ExamAnswerInput, ExamOverview, ExamResult, ExamSession } from '../../models/exams/exam.models';

@Injectable({ providedIn: 'root' })
export class ExamApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/exams`;

  overview(): Observable<ExamOverview> {
    return this.http.get<ExamOverview>(this.base);
  }

  startLevel(code: CefrLevel): Observable<ExamSession> {
    return this.http.post<ExamSession>(`${this.base}/levels/${code}/start`, {});
  }

  startPlacement(): Observable<ExamSession> {
    return this.http.post<ExamSession>(`${this.base}/placement/start`, {});
  }

  skipPlacement(): Observable<void> {
    return this.http.post<void>(`${this.base}/placement/skip`, {});
  }

  session(attemptId: string): Observable<ExamSession> {
    return this.http.get<ExamSession>(`${this.base}/attempts/${attemptId}`);
  }

  saveAnswer(attemptId: string, questionId: string, answer: string[], flagged: boolean): Observable<void> {
    return this.http.put<void>(`${this.base}/attempts/${attemptId}/answers/${questionId}`, { answer, flagged });
  }

  submit(attemptId: string, answers: ExamAnswerInput[]): Observable<ExamResult> {
    return this.http.post<ExamResult>(`${this.base}/attempts/${attemptId}/submit`, { answers });
  }

  result(attemptId: string): Observable<ExamResult> {
    return this.http.get<ExamResult>(`${this.base}/attempts/${attemptId}/result`);
  }
}