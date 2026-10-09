import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { PagedResult } from '../../core/models/paged-result.model';
import { toHttpParams } from '../../core/services/query-params';
import { GrammarQuery, GrammarSummary, GrammarTopic } from '../../models/grammar/grammar.models';

@Injectable({ providedIn: 'root' })
export class GrammarApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/grammar`;

  search(query: GrammarQuery): Observable<PagedResult<GrammarSummary>> {
    return this.http.get<PagedResult<GrammarSummary>>(this.base, { params: toHttpParams(query) });
  }

  get(id: string): Observable<GrammarTopic> {
    return this.http.get<GrammarTopic>(`${this.base}/${id}`);
  }

  forLesson(lessonId: string): Observable<GrammarTopic[]> {
    return this.http.get<GrammarTopic[]>(`${this.base}/lesson/${lessonId}`);
  }
}