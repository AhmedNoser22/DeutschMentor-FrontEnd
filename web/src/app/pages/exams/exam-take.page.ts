import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, concatMap, interval, startWith } from 'rxjs';
import { ExamQuestionComponent } from '../../components/exams/exam-question.component';
import { QuestionGridComponent } from '../../components/exams/question-grid.component';
import { toApiError } from '../../core/models/api-error.model';
import { clockOffsetMs, formatCountdown, parseUtc } from '../../core/services/clock';
import { ExamAttemptStatus, ExamKind } from '../../domain/enums/exam.enums';
import { ExerciseType } from '../../domain/enums/practice.enums';
import { ExamAnswerInput, ExamQuestion, ExamSession } from '../../models/exams/exam.models';
import { ExamApiService } from '../../services/exams/exam-api.service';
import { IconComponent } from '../../shared/components/icon.component';

const NO_ANSWER: readonly string[] = [];
const LOW_TIME_MS = 5 * 60 * 1000;
const SAVE_DELAY_MS = 500;

@Component({
  selector: 'dm-exam-take-page',
  imports: [RouterLink, IconComponent, ExamQuestionComponent, QuestionGridComponent],
  template: `
    <section class="page">
      @if (loading()) {
        <p class="muted">Loading exam...</p>
      } @else if (!session()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
        <a class="btn btn-outline" routerLink="/exams">Back to exams</a>
      } @else if (session(); as s) {
        <header class="head">
          <div>
            <p class="eyebrow">{{ s.kind === ExamKind.Placement ? 'Placement test' : 'Level exam' }}</p>
            <h1 class="title">{{ s.title }}</h1>
          </div>
          <div class="timer" [class.low]="lowTime()" role="timer">
            <dm-icon name="clock" />
            <span>{{ timeLabel() }}</span>
          </div>
        </header>

        <div class="progress"><span [style.width.%]="progress()"></span></div>

        <div class="layout">
          <article class="card question">
            @if (current(); as q) {
              <p class="eyebrow">Question {{ index() + 1 }} of {{ questions().length }} · {{ q.skill }}</p>

              <dm-exam-question
                [question]="q"
                [answer]="answerFor(q.exercise.id)"
                (answerChange)="onAnswer(q.exercise.id, $event)"
              />
            }

            <div class="nav">
              <button class="btn btn-outline" type="button" [class.flagged]="currentFlagged()" (click)="toggleFlag()">
                <dm-icon name="flag" /> {{ currentFlagged() ? 'Flagged' : 'Flag' }}
              </button>
              <span class="spacer"></span>
              <button class="btn btn-outline" type="button" [disabled]="index() === 0" (click)="go(index() - 1)">Previous</button>
              @if (isLast()) {
                <button class="btn btn-primary" type="button" (click)="askSubmit()">Review and submit</button>
              } @else {
                <button class="btn btn-primary" type="button" (click)="go(index() + 1)">Next question</button>
              }
            </div>
          </article>

          <aside class="card side">
            <h2>Questions</h2>
            <dm-question-grid
              [total]="questions().length"
              [current]="index()"
              [answered]="answeredIndexes()"
              [flagged]="flaggedIndexes()"
              (picked)="go($event)"
            />
            <p class="muted">{{ answeredCount() }} answered · {{ flaggedCount() }} flagged</p>

            @if (error()) {
              <div class="alert alert-error" role="alert">{{ error() }}</div>
            }

            @if (confirming()) {
              <div class="confirm" role="alertdialog" aria-live="polite">
                <p><strong>Submit the exam?</strong></p>
                <p class="muted">
                  @if (unansweredCount() > 0) {
                    You still have {{ unansweredCount() }} unanswered {{ unansweredCount() === 1 ? 'question' : 'questions' }}. They count as wrong.
                  } @else {
                    You answered every question.
                  }
                  You cannot change your answers afterwards.
                </p>
                <div class="row">
                  <button class="btn btn-primary" type="button" [disabled]="submitting()" (click)="submit()">
                    {{ submitting() ? 'Submitting...' : 'Submit now' }}
                  </button>
                  <button class="btn btn-outline" type="button" [disabled]="submitting()" (click)="confirming.set(false)">Keep working</button>
                </div>
              </div>
            } @else {
              <button class="btn btn-dark btn-block" type="button" [disabled]="submitting()" (click)="askSubmit()">
                {{ submitting() ? 'Submitting...' : 'Submit exam' }}
              </button>
            }
          </aside>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 0.9rem; }
      .title { font-size: clamp(2rem, 6vw, 2.8rem); }
      .timer { display: inline-flex; align-items: center; gap: 0.5rem; font-family: var(--font-display); font-size: clamp(2rem, 6vw, 2.8rem); font-weight: 700; }
      .timer.low { color: var(--primary); }
      .progress { margin-bottom: 1.25rem; }
      .layout { display: grid; gap: 1rem; align-items: start; }
      .question { display: grid; gap: 1.25rem; }
      .nav { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; padding-top: 0.5rem; }
      .nav .spacer { flex: 1; }
      .nav dm-icon { width: 1.15rem; height: 1.15rem; }
      .nav .flagged { background: var(--gold-soft); border-color: var(--gold); }
      .side { display: grid; gap: 0.9rem; }
      .side h2 { font-size: 1.6rem; }
      .confirm { display: grid; gap: 0.6rem; padding: 1rem; background: var(--surface-2); border-radius: var(--radius-md); }
      .confirm .row { display: flex; flex-wrap: wrap; gap: 0.6rem; }
      .alert { margin: 0; }
      @media (min-width: 900px) {
        .layout { grid-template-columns: 1.7fr 1fr; }
      }
    `
  ]
})
export class ExamTakePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ExamApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly attemptId = this.route.snapshot.paramMap.get('id') ?? '';
  private readonly pending = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly saveQueue = new Subject<string>();
  private offsetMs = 0;
  private expiresAtMs = 0;
  private autoSubmitted = false;

  protected readonly ExamKind = ExamKind;
  protected readonly session = signal<ExamSession | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly index = signal(0);
  protected readonly answers = signal<Readonly<Record<string, readonly string[]>>>({});
  protected readonly flags = signal<ReadonlySet<string>>(new Set<string>());
  protected readonly remainingMs = signal(0);
  protected readonly confirming = signal(false);
  protected readonly submitting = signal(false);

  protected readonly questions = computed(() => this.session()?.questions ?? []);
  protected readonly current = computed(() => this.questions()[this.index()] ?? null);
  protected readonly isLast = computed(() => this.index() >= this.questions().length - 1);

  protected readonly answeredIndexes = computed<ReadonlySet<number>>(
    () => new Set(this.questions().flatMap((q, i) => (this.isAnswered(q) ? [i] : [])))
  );
  protected readonly flaggedIndexes = computed<ReadonlySet<number>>(
    () => new Set(this.questions().flatMap((q, i) => (this.flags().has(q.exercise.id) ? [i] : [])))
  );

  protected readonly answeredCount = computed(() => this.answeredIndexes().size);
  protected readonly flaggedCount = computed(() => this.flaggedIndexes().size);
  protected readonly unansweredCount = computed(() => this.questions().length - this.answeredCount());
  protected readonly progress = computed(() =>
    this.questions().length ? (this.answeredCount() / this.questions().length) * 100 : 0
  );
  protected readonly timeLabel = computed(() => formatCountdown(this.remainingMs()));
  protected readonly lowTime = computed(() => this.remainingMs() < LOW_TIME_MS);
  protected readonly currentFlagged = computed(() => {
    const question = this.current();
    return !!question && this.flags().has(question.exercise.id);
  });

  constructor() {
    this.saveQueue
      .pipe(
        concatMap((questionId) =>
          this.api
            .saveAnswer(this.attemptId, questionId, [...this.answerFor(questionId)], this.flags().has(questionId))
            .pipe(catchError(() => EMPTY))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    this.destroyRef.onDestroy(() => this.cancelPending());
    this.load();
  }

  protected answerFor(questionId: string): readonly string[] {
    return this.answers()[questionId] ?? NO_ANSWER;
  }

  protected onAnswer(questionId: string, value: string[]): void {
    this.answers.update((current) => ({ ...current, [questionId]: value }));
    this.schedule(questionId);
  }

  protected toggleFlag(): void {
    const question = this.current();
    if (!question) {
      return;
    }

    const id = question.exercise.id;
    this.flags.update((current) => {
      const next = new Set(current);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
    this.schedule(id, true);
  }

  protected go(target: number): void {
    this.flushPending();
    const last = Math.max(0, this.questions().length - 1);
    this.index.set(Math.min(Math.max(target, 0), last));
    this.confirming.set(false);
  }

  protected askSubmit(): void {
    this.flushPending();
    this.confirming.set(true);
  }

  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.cancelPending();

    const payload: ExamAnswerInput[] = this.questions()
      .map((question) => ({
        questionId: question.exercise.id,
        answer: [...this.answerFor(question.exercise.id)],
        flagged: this.flags().has(question.exercise.id)
      }))
      .filter((item) => item.answer.length > 0 || item.flagged);

    this.api.submit(this.attemptId, payload).subscribe({
      next: (result) => void this.router.navigate(['/exams/result', result.attemptId], { replaceUrl: true }),
      error: (e: unknown) => {
        this.submitting.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  protected isAnswered(question: ExamQuestion): boolean {
    const exercise = question.exercise;
    const value = this.answers()[exercise.id] ?? NO_ANSWER;

    switch (exercise.type) {
      case ExerciseType.MultipleChoice:
      case ExerciseType.TrueFalse:
        return value.length === 1 && value[0].length > 0;
      case ExerciseType.FillBlank:
        return value.length === exercise.blankCount && value.every((item) => item.trim().length > 0);
      case ExerciseType.Ordering:
        return value.length === exercise.words.length;
      case ExerciseType.Matching:
        return value.length === exercise.left.length;
      default:
        return false;
    }
  }

  private load(): void {
    this.api.session(this.attemptId).subscribe({
      next: (session) => {
        if (session.status !== ExamAttemptStatus.InProgress) {
          void this.router.navigate(['/exams/result', session.attemptId], { replaceUrl: true });
          return;
        }

        this.offsetMs = clockOffsetMs(session.serverNowUtc);
        this.expiresAtMs = parseUtc(session.expiresAtUtc);

        const saved: Record<string, readonly string[]> = {};
        const flagged = new Set<string>();
        for (const item of session.answers) {
          saved[item.questionId] = item.answer;
          if (item.flagged) {
            flagged.add(item.questionId);
          }
        }

        this.answers.set(saved);
        this.flags.set(flagged);
        this.session.set(session);

        const firstOpen = session.questions.findIndex((question) => !this.isAnswered(question));
        this.index.set(firstOpen >= 0 ? firstOpen : 0);

        this.loading.set(false);
        this.startTimer();
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  private startTimer(): void {
    interval(1000)
      .pipe(startWith(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.tick());
  }

  private tick(): void {
    const remaining = this.expiresAtMs - (Date.now() + this.offsetMs);
    this.remainingMs.set(remaining);

    if (remaining <= 0 && !this.autoSubmitted) {
      this.autoSubmitted = true;
      this.submit();
    }
  }

  private schedule(questionId: string, immediate = false): void {
    const existing = this.pending.get(questionId);
    if (existing) {
      clearTimeout(existing);
      this.pending.delete(questionId);
    }

    if (immediate) {
      this.saveQueue.next(questionId);
      return;
    }

    this.pending.set(
      questionId,
      setTimeout(() => {
        this.pending.delete(questionId);
        this.saveQueue.next(questionId);
      }, SAVE_DELAY_MS)
    );
  }

  private flushPending(): void {
    const ids = [...this.pending.keys()];
    this.cancelPending();
    for (const id of ids) {
      this.saveQueue.next(id);
    }
  }

  private cancelPending(): void {
    for (const timer of this.pending.values()) {
      clearTimeout(timer);
    }
    this.pending.clear();
  }
}