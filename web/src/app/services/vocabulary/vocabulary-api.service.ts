import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { PagedResult } from '../../core/models/paged-result.model';
import { toHttpParams } from '../../core/services/query-params';
import { VocabularyItem, VocabularyQuery } from '../../models/vocabulary/vocabulary.models';

@Injectable({ providedIn: 'root' })
export class VocabularyApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/vocabulary`;

  search(query: VocabularyQuery): Observable<PagedResult<VocabularyItem>> {
    return this.http.get<PagedResult<VocabularyItem>>(this.base, { params: toHttpParams(query) });
  }

  forLesson(lessonId: string): Observable<VocabularyItem[]> {
    return this.http.get<VocabularyItem[]>(`${this.base}/lesson/${lessonId}`);
  }

  addToReview(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/review`, {});
  }

  removeFromReview(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/review`);
  }
}