import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toApiError } from '../../core/models/api-error.model';
import { WritingTask } from '../../models/writing/writing.models';
import { WritingApiService } from '../../services/writing/writing-api.service';
import { WritingTaskComponent } from './writing-task.component';

@Component({
  selector: 'dm-writing-view',
  imports: [WritingTaskComponent],
  template: `
    @if (loading()) {
      <p class="muted">Loading writing tasks...</p>
    } @else if (error()) {
      <div class="alert alert-error" role="alert">{{ error() }}</div>
      <button class="btn btn-outline" type="button" (click)="load()">Try again</button>
    } @else if (tasks().length === 0) {
      <p class="empty">No writing task in this lesson yet.</p>
    } @else {
      @for (task of tasks(); track task.id) {
        <dm-writing-task [task]="task" (submitted)="onSubmitted(task.id)" />
      }
    }
  `,
  styles: [`:host { display: block; }`]
})
export class WritingViewComponent implements OnInit {
  private readonly api = inject(WritingApiService);
  private readonly destroyRef = inject(DestroyRef);
  private completedEmitted = false;

  readonly lessonId = input.required<string>();
  readonly completed = output<void>();

  protected readonly tasks = signal<WritingTask[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly done = signal<ReadonlySet<string>>(new Set<string>());

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
        next: (tasks) => {
          this.tasks.set(tasks);
          this.done.set(new Set(tasks.filter((task) => task.latest !== null).map((task) => task.id)));
          this.loading.set(false);
          this.checkDone();
        },
        error: (e: unknown) => {
          this.loading.set(false);
          this.error.set(toApiError(e).message);
        }
      });
  }

  protected onSubmitted(taskId: string): void {
    this.done.update((current) => new Set(current).add(taskId));
    this.checkDone();
  }

  private checkDone(): void {
    if (!this.completedEmitted && this.done().size >= this.tasks().length) {
      this.completedEmitted = true;
      this.completed.emit();
    }
  }
}