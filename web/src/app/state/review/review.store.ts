import { effect, inject, Injectable, signal } from '@angular/core';
import { ReviewApiService } from '../../services/review/review-api.service';
import { AuthStore } from '../auth/auth.store';

@Injectable({ providedIn: 'root' })
export class ReviewStore {
  private readonly api = inject(ReviewApiService);
  private readonly auth = inject(AuthStore);

  readonly dueCount = signal(0);

  constructor() {
    effect(() => {
      if (!this.auth.isAuthenticated()) {
        this.dueCount.set(0);
      }
    });
  }

  refresh(): void {
    this.api.summary().subscribe({
      next: (summary) => this.dueCount.set(summary.dueCount),
      error: () => undefined
    });
  }

  setDue(count: number): void {
    this.dueCount.set(Math.max(0, count));
  }
}