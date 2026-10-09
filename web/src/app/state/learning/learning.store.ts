import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { toApiError } from '../../core/models/api-error.model';
import { LevelStatus } from '../../domain/enums/learning.enums';
import { LevelSummary } from '../../models/learning/learning.models';
import { LearningApiService } from '../../services/learning/learning-api.service';

@Injectable({ providedIn: 'root' })
export class LearningStore {
  private readonly api = inject(LearningApiService);

  readonly levels = signal<readonly LevelSummary[]>([]);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);

  readonly activeLevel = computed(
    () => this.levels().find((level) => level.status === LevelStatus.InProgress) ?? this.levels()[0] ?? null
  );

  refresh(): Observable<LevelSummary[]> {
    return this.api.levels().pipe(
      tap({
        next: (levels) => {
          this.levels.set(levels);
          this.loaded.set(true);
          this.error.set(null);
        },
        error: (e: unknown) => this.error.set(toApiError(e).message)
      })
    );
  }

  reset(): void {
    this.levels.set([]);
    this.loaded.set(false);
    this.error.set(null);
  }
}