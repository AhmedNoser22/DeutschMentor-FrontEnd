import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { PagedResult } from '../../core/models/paged-result.model';
import { toHttpParams } from '../../core/services/query-params';
import { AdminLesson, AdminStats, AdminWriting, ExamPoolRow, ImportReport } from '../../models/admin/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/admin`;

  stats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/stats`);
  }

  lessons(query: { search: string; level: string; status: string; page: number }): Observable<PagedResult<AdminLesson>> {
    return this.http.get<PagedResult<AdminLesson>>(`${this.base}/lessons`, { params: toHttpParams(query) });
  }

  setPublished(id: string, published: boolean): Observable<void> {
    return this.http.post<void>(`${this.base}/lessons/${id}/${published ? 'publish' : 'unpublish'}`, {});
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/lessons/${id}`);
  }

  check(pack: unknown): Observable<ImportReport> {
    return this.http.post<ImportReport>(`${this.base}/import/check`, pack);
  }

  import(pack: unknown, publish: boolean): Observable<ImportReport> {
    return this.http.post<ImportReport>(`${this.base}/import?publish=${publish}`, pack);
  }

  pendingWriting(): Observable<AdminWriting[]> {
    return this.http.get<AdminWriting[]>(`${this.base}/writing/pending`);
  }

  reviewWriting(id: string, scorePercent: number | null, feedback: string): Observable<void> {
    return this.http.post<void>(`${this.base}/writing/${id}/review`, { scorePercent, feedback });
  }

  examPool(): Observable<ExamPoolRow[]> {
    return this.http.get<ExamPoolRow[]>(`${this.base}/exam-pool`);
  }
}