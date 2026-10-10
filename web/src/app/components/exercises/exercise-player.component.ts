import { Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toApiError } from '../../core/models/api-error.model';
import { ExerciseChecked, ExerciseItem } from '../../models/exercises/exercise.models';
import { ExerciseApiService } from '../../services/exercises/exercise-api.service';
import { ExerciseCardComponent } from './exercise-card.component';

@Component({
  selector: 'dm-exercise-player',
  imports: [ExerciseCardComponent],
  template: `
    @if (loading()) {
      <p class="muted">Loading exercises...</p>
    } @else if (error()) {
      <div class="alert alert-error" role="alert">{{ error() }}</div>
      <button class="btn btn-outline" type="button" (click)="load()">Try again</button>
    } @else if (exercises().length === 0) {
      <p class="empty">No exercises in this lesson yet.</p>
    } @else if (finished()) {
      <section class="card done">
        <p class="eyebrow">Practice complete</p>
        <h2>{{ firstTry() }} of {{ exercises().length }} right on the first try</h2>
        <p class="muted">Every exercise is solved. You can practise again or move to the next step.</p>
        <div><button class="btn btn-outline" type="button" (click)="restart()">Practise again</button></div>
      </section>
    } @else {
      <div class="segments" aria-hidden="true">
        @for (item of exercises(); track item.id; let i = $index) {
          <span class="seg" [class.done]="solved().has(item.id)" [class.current]="i === index()"></span>
        }
      </div>

      @for (item of currentList(); track item.id) {
        <section class="card">
          <dm-exercise-card
            [exercise]="item"
            [position]="index() + 1"
            [total]="exercises().length"
            [continueLabel]="isLast() ? 'Finish' : 'Next'"
            (checked)="onChecked($event)"
            (continued)="next()"
          />
        </section>
      }
    }
  `,
  styles: [
    `
      :host { display: block; }
      .segments { display: flex; gap: 0.4rem; margin-bottom: 1rem; }
      .seg { flex: 1; height: 6px; border-radius: 999px; background: var(--surface-2); }
      .seg.done { background: var(--success); }
      .seg.current { background: var(--ink); }
      .done { display: grid; gap: 0.75rem; }
      .done h2 { font-size: 2rem; }
    `
  ]
})
export class ExercisePlayerComponent implements OnInit {
  private readonly api = inject(ExerciseApiService);
  private readonly destroyRef = inject(DestroyRef);
  private completedEmitted = false;

  readonly lessonId = input.required<string>();
  readonly completed = output<void>();

  protected readonly exercises = signal<ExerciseItem[]>([]);
  protected readonly solved = signal<ReadonlySet<string>>(new Set<string>());
  protected readonly index = signal(0);
  protected readonly firstTry = signal(0);
  protected readonly finished = signal(false);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly current = computed(() => this.exercises()[this.index()] ?? null);
  protected readonly currentList = computed(() => {
    const item = this.current();
    return item ? [item] : [];
  });
  protected readonly isLast = computed(() => this.index() >= this.exercises().length - 1);

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
        next: (set) => {
          this.exercises.set(set.exercises);
          this.solved.set(new Set(set.solvedExerciseIds));
          this.loading.set(false);

          const allSolved = set.exercises.every((item) => set.solvedExerciseIds.includes(item.id));
          if (allSolved) {
            this.emitCompleted();
          }
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
    if (event.firstTry) {
      this.firstTry.update((value) => value + 1);
    }
  }

  protected next(): void {
    if (this.isLast()) {
      this.finished.set(true);
      this.emitCompleted();
      return;
    }
    this.index.update((value) => value + 1);
  }

  protected restart(): void {
    this.index.set(0);
    this.firstTry.set(0);
    this.finished.set(false);
  }

  private emitCompleted(): void {
    if (!this.completedEmitted) {
      this.completedEmitted = true;
      this.completed.emit();
    }
  }
}