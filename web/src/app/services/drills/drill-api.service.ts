import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { Article } from '../../domain/enums/learning.enums';
import { ArticleAnswerResult, ArticleDrill } from '../../models/drills/drill.models';

@Injectable({ providedIn: 'root' })
export class DrillApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/drills`;

  articles(): Observable<ArticleDrill> {
    return this.http.get<ArticleDrill>(`${this.base}/articles`);
  }

  answerArticle(vocabularyItemId: string, article: Article): Observable<ArticleAnswerResult> {
    return this.http.post<ArticleAnswerResult>(`${this.base}/articles/answer`, { vocabularyItemId, article });
  }
}