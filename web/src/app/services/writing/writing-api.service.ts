import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { WritingSubmission, WritingTask } from '../../models/writing/writing.models';

@Injectable({ providedIn: 'root' })
export class WritingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/writing`;

  forLesson(lessonId: string): Observable<WritingTask[]> {
    return this.http.get<WritingTask[]>(`${this.base}/lesson/${lessonId}`);
  }

  submit(taskId: string, text: string): Observable<WritingSubmission> {
    return this.http.post<WritingSubmission>(`${this.base}/tasks/${taskId}/submissions`, { text });
  }

  requestReview(submissionId: string): Observable<WritingSubmission> {
    return this.http.post<WritingSubmission>(`${this.base}/submissions/${submissionId}/request-review`, {});
  }
}