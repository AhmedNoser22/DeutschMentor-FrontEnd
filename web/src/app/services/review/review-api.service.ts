import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { ReviewRating } from '../../domain/enums/progress.enums';
import { RateReviewResult, ReviewQueue, ReviewSummary } from '../../models/review/review.models';

@Injectable({ providedIn: 'root' })
export class ReviewApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_SETTINGS.apiBaseUrl}/api/review`;

  summary(): Observable<ReviewSummary> {
    return this.http.get<ReviewSummary>(`${this.base}/summary`);
  }

  queue(): Observable<ReviewQueue> {
    return this.http.get<ReviewQueue>(`${this.base}/queue`);
  }

  rate(reviewItemId: string, rating: ReviewRating): Observable<RateReviewResult> {
    return this.http.post<RateReviewResult>(`${this.base}/${reviewItemId}/rate`, { rating });
  }
}