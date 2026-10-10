import { Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toApiError } from '../../core/models/api-error.model';
import { ExerciseChecked } from '../../models/exercises/exercise.models';
import { ReadingPassage } from '../../models/reading/reading.models';
import { ReadingApiService } from '../../services/reading/reading-api.service';
import { ExerciseCardComponent } from '../exercises/exercise-card.component';

@Component({
  selector: 'dm-reading-view',
  imports: [ExerciseCardComponent],
  template: `
    @if (loading()) {
      <p class="muted">Loading reading...</p>
    } @else if (error()) {
      <div class="alert alert-error" role="alert">{{ error() }}</div>
      <button class="btn btn-outline" type="button" (click)="load()">Try again</button>
    } @else if (passages().length === 0) {
      <p class="empty">No reading text in this lesson yet.</p>
    } @else {
      @for (passage of passages(); track passage.id) {
        <article class="card passage">
          <h2>{{ passage.title }}</h2>

          <div class="lines" lang="de">
            @for (line of passage.lines; track $index) {
              <p>
                @if (line.speaker) {
                  <strong class="speaker">{{ line.speaker }}</strong>
                }
                {{ line.text }}
              </p>
            }
          </div>

          @for (question of passage.questions; track question.id) {
            <div class="question">
              <dm-exercise-card [exercise]="question" [compact]="true" (checked)="onChecked($event)" />
            </div>
          }
        </article>
      }
    }
  `,
  styles: [
    `
      :host { display: block; }
      .passage { display: grid; gap: 1rem; margin-bottom: 1rem; }
      .passage h2 { font-size: 1.9rem; }
      .lines { display: grid; gap: 0.5rem; padding-bottom: 1rem; }
      .speaker { margin-right: 0.4rem; }
      .question { padding-top: 1rem; border-top: 1px solid var(--line); }
    `
  ]
})
export class ReadingViewComponent implements OnInit {
  private readonly api = inject(ReadingApiService);
  private readonly destroyRef = inject(DestroyRef);
  private completedEmitted = false;

  readonly lessonId = input.required<string>();
  readonly completed = output<void>();

  protected readonly passages = signal<ReadingPassage[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly solved = signal<ReadonlySet<string>>(new Set<string>());
  private readonly totalQuestions = computed(() =>
    this.passages().reduce((count, passage) => count + passage.questions.length, 0)
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .forLesson(this.lessonId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (passages) => {
          this.passages.set(passages);
          this.solved.set(new Set(passages.flatMap((passage) => passage.solvedQuestionIds)));
          this.loading.set(false);
          this.checkDone();
        },
        error: (e: unknown) => {
          this.loading.set(false);
          this.error.set(toApiError(e).message);
        }
      });
  }

  protected onChecked(event: ExerciseChecked): void {
    if (!event.correct) {
      return;
    }
    this.solved.update((current) => new Set(current).add(event.exerciseId));
    this.checkDone();
  }

  private checkDone(): void {
    if (!this.completedEmitted && this.solved().size >= this.totalQuestions()) {
      this.completedEmitted = true;
      this.completed.emit();
    }
  }
}