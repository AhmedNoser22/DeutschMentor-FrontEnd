import { Component, DestroyRef, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toApiError } from '../../core/models/api-error.model';
import { WritingReviewStatus } from '../../domain/enums/practice.enums';
import { WritingSubmission, WritingTask } from '../../models/writing/writing.models';
import { WritingApiService } from '../../services/writing/writing-api.service';

@Component({
  selector: 'dm-writing-task',
  template: `
    <article class="card task">
      <p class="eyebrow">Writing task</p>
      <h2>{{ task().title }}</h2>
      <p class="prompt">{{ task().prompt }}</p>

      @if (editing()) {
        <div class="field">
          <label [attr.for]="'writing-' + task().id">Your answer in German</label>
          <textarea
            class="input area"
            rows="5"
            maxlength="2000"
            lang="de"
            spellcheck="false"
            placeholder="Schreiben Sie hier..."
            [id]="'writing-' + task().id"
            [value]="text()"
            (input)="onInput($event)"
          ></textarea>
          <span class="muted small">{{ wordCount() }} words · aim for at least {{ task().minWords }}</span>
        </div>

        @if (error()) {
          <div class="alert alert-error" role="alert">{{ error() }}</div>
        }

        <div class="row">
          <button class="btn btn-primary" type="button" [disabled]="busy() || !text().trim()" (click)="submit()">
            {{ busy() ? 'Checking...' : 'Check my writing' }}
          </button>
          @if (latest()) {
            <button class="btn btn-outline" type="button" (click)="cancel()">Cancel</button>
          }
        </div>
      } @else if (latest(); as s) {
        <div class="result">
          <div class="score">
            <span class="num">{{ s.scorePercent }}%</span>
            <span [class]="'badge ' + (s.passed ? 'badge-success' : 'badge-danger')">
              {{ s.passed ? 'Passed' : 'Keep practising' }}
            </span>
          </div>
          <p class="muted small">Automatic check: required words and length. It does not judge grammar.</p>

          <blockquote class="mine" lang="de">{{ s.text }}</blockquote>

          <ul class="checks">
            @for (check of s.checks; track $index) {
              <li [class.ok]="check.met">
                <span class="mark" aria-hidden="true">{{ check.met ? '✓' : '×' }}</span>
                {{ check.label }}
              </li>
            }
          </ul>

          <div class="sample">
            <p class="eyebrow">Model answer</p>
            <p lang="de">{{ s.sampleAnswer }}</p>
          </div>

          @if (error()) {
            <div class="alert alert-error" role="alert">{{ error() }}</div>
          }

          @switch (s.reviewStatus) {
            @case (WritingReviewStatus.NotRequested) {
              <div>
                <button class="btn btn-outline" type="button" [disabled]="busy()" (click)="askReview(s.id)">
                  Ask a teacher to review
                </button>
              </div>
            }
            @case (WritingReviewStatus.Pending) {
              <p><span class="badge badge-gold">Waiting for a teacher</span></p>
            }
            @case (WritingReviewStatus.Reviewed) {
              <div class="teacher">
                <p class="eyebrow">Teacher feedback</p>
                @if (s.teacherScorePercent !== null) {
                  <p><strong>{{ s.teacherScorePercent }}%</strong></p>
                }
                <p>{{ s.teacherFeedback }}</p>
              </div>
            }
          }

          <div>
            <button class="btn btn-dark" type="button" (click)="rewrite()">Write again</button>
          </div>
        </div>
      }
    </article>
  `,
  styles: [
    `
      :host { display: block; }
      .task { display: grid; gap: 1rem; margin-bottom: 1rem; }
      .task h2 { font-size: 1.9rem; }
      .area { min-height: 140px; padding: 0.75rem 0.9rem; resize: vertical; line-height: 1.5; }
      .small { font-size: 0.85rem; }
      .row { display: flex; flex-wrap: wrap; gap: 0.75rem; }
      .result { display: grid; gap: 1rem; }
      .score { display: flex; align-items: center; gap: 0.9rem; }
      .num { font-family: var(--font-display); font-size: 3.4rem; font-weight: 700; line-height: 1; }
      .mine { margin: 0; padding: 0.9rem 1rem; background: var(--surface-2); border-left: 4px solid var(--ink); border-radius: var(--radius-sm); white-space: pre-wrap; }
      .checks { display: grid; gap: 0.5rem; margin: 0; padding: 0; list-style: none; }
      .checks li { display: flex; align-items: center; gap: 0.6rem; color: var(--danger); }
      .checks li.ok { color: var(--success); }
      .mark { display: grid; place-items: center; width: 1.5rem; height: 1.5rem; font-weight: 700; border-radius: 50%; background: var(--danger-soft); }
      .checks li.ok .mark { background: var(--success-soft); }
      .sample, .teacher { padding: 0.9rem 1rem; background: var(--surface-2); border-radius: var(--radius-sm); }
    `
  ]
})
export class WritingTaskComponent {
  private readonly api = inject(WritingApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly task = input.required<WritingTask>();
  readonly submitted = output<void>();

  protected readonly WritingReviewStatus = WritingReviewStatus;

  protected readonly latest = linkedSignal<WritingSubmission | null>(() => this.task().latest);
  protected readonly editing = linkedSignal<boolean>(() => this.task().latest === null);
  protected readonly text = linkedSignal<string>(() => this.task().latest?.text ?? '');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly wordCount = computed(() => {
    const value = this.text().trim();
    return value ? value.split(/\s+/).length : 0;
  });

  protected onInput(event: Event): void {
    this.text.set((event.target as HTMLTextAreaElement).value);
  }

  protected submit(): void {
    const value = this.text().trim();
    if (!value || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.error.set(null);

    this.api
      .submit(this.task().id, value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (submission) => {
          this.latest.set(submission);
          this.editing.set(false);
          this.busy.set(false);
          this.submitted.emit();
        },
        error: (e: unknown) => {
          this.busy.set(false);
          this.error.set(toApiError(e).message);
        }
      });
  }

  protected askReview(submissionId: string): void {
    this.busy.set(true);
    this.error.set(null);

    this.api
      .requestReview(submissionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (submission) => {
          this.latest.set(submission);
          this.busy.set(false);
        },
        error: (e: unknown) => {
          this.busy.set(false);
          this.error.set(toApiError(e).message);
        }
      });
  }

  protected rewrite(): void {
    this.error.set(null);
    this.editing.set(true);
  }

  protected cancel(): void {
    this.text.set(this.latest()?.text ?? '');
    this.editing.set(false);
  }
}