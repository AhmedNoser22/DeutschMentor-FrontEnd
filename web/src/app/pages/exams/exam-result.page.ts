import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { ScoreBarsComponent } from '../../components/exams/score-bars.component';
import { toApiError } from '../../core/models/api-error.model';
import { clockOffsetMs, formatCountdown, parseUtc } from '../../core/services/clock';
import { ExamAttemptStatus, ExamKind } from '../../domain/enums/exam.enums';
import { CefrLevel } from '../../domain/enums/user.enums';
import { ExamResult } from '../../models/exams/exam.models';
import { ExamApiService } from '../../services/exams/exam-api.service';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthStore } from '../../state/auth/auth.store';
import { LearningStore } from '../../state/learning/learning.store';

@Component({
  selector: 'dm-exam-result-page',
  imports: [RouterLink, IconComponent, ScoreBarsComponent],
  template: `
    <section class="page">
      <p class="eyebrow">Result</p>

      @if (loading()) {
        <p class="muted">Loading result...</p>
      } @else if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
        <a class="btn btn-outline" routerLink="/exams">Back to exams</a>
      } @else if (result(); as r) {
        <h1 class="hello">{{ r.title }}</h1>

        <article class="card result">
          @if (r.kind === ExamKind.Placement) {
            <div class="top">
              <div class="big">{{ r.placedLevelCode }}</div>
              <div class="side">
                <span class="badge badge-success"><dm-icon name="check" /> Placement complete</span>
                <p class="count">Your starting level</p>
                <p class="muted">{{ r.correctCount }} of {{ r.totalQuestions }} correct</p>
              </div>
            </div>
          } @else {
            <div class="top">
              <div class="big">{{ r.scorePercent }}%</div>
              <div class="side">
                @if (r.passed) {
                  <span class="badge badge-success"><dm-icon name="check" /> Passed</span>
                } @else {
                  <span class="badge badge-danger">Not passed</span>
                }
                <p class="count">{{ r.correctCount }} of {{ r.totalQuestions }} correct</p>
                <p class="muted">Pass mark {{ r.passMarkPercent }}%</p>
              </div>
            </div>
          }

          @if (r.status === ExamAttemptStatus.Expired) {
            <div class="alert alert-error" role="status">Time ran out. Unanswered questions count as wrong.</div>
          }

          @if (r.kind === ExamKind.Level && !r.passed) {
            <p class="retake">
              @if (canRetake()) {
                You can retake the exam now.
              } @else {
                You can retake the exam in <strong>{{ retakeLabel() }}</strong>
              }
            </p>
          }

          @if (r.breakdown.length) {
            <div class="breakdown">
              <p class="eyebrow">{{ r.kind === ExamKind.Placement ? 'By level' : 'By skill' }}</p>
              <dm-score-bars [items]="r.breakdown" [passMark]="r.passMarkPercent" />
            </div>
          }

          @if (r.weakAreas.length) {
            <p class="muted">Weak areas: {{ r.weakAreas.join(', ') }}</p>
          }

          <div class="actions">
            @if (r.kind === ExamKind.Placement) {
              <a class="btn btn-primary" routerLink="/learn" [queryParams]="{ level: r.placedLevelCode }">Start learning</a>
              <a class="btn btn-outline" routerLink="/today">Go to Today</a>
            } @else if (r.passed) {
              <a class="btn btn-primary" routerLink="/certificates" [queryParams]="{ level: r.levelCode }">
                Get your {{ r.levelCode }} certificate
              </a>
              @if (r.nextLevelCode) {
                <a class="btn btn-outline" routerLink="/learn" [queryParams]="{ level: r.nextLevelCode }">Open {{ r.nextLevelCode }}</a>
              }
            } @else {
              <a class="btn btn-primary" routerLink="/learn" [queryParams]="{ level: r.levelCode }">Review weak areas</a>
              <button class="btn btn-outline" type="button" [disabled]="!canRetake() || starting()" (click)="retake(r.levelCode)">
                {{ starting() ? 'Starting...' : 'Retake exam' }}
              </button>
            }
          </div>
        </article>
      }
    </section>
  `,
  styles: [
    `
      .result { display: grid; gap: 1.25rem; }
      .top { display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem; }
      .big { font-family: var(--font-display); font-size: clamp(5rem, 22vw, 9rem); font-weight: 700; line-height: 0.9; }
      .side { display: grid; gap: 0.35rem; justify-items: start; }
      .count { font-family: var(--font-display); font-size: 2rem; font-weight: 700; }
      .badge dm-icon { width: 1rem; height: 1rem; }
      .retake { font-size: 1.05rem; }
      .breakdown { display: grid; gap: 0.9rem; }
      .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
      .alert { margin: 0; }
    `
  ]
})
export class ExamResultPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ExamApiService);
  private readonly auth = inject(AuthStore);
  private readonly learning = inject(LearningStore);

  protected readonly ExamKind = ExamKind;
  protected readonly ExamAttemptStatus = ExamAttemptStatus;
  protected readonly result = signal<ExamResult | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly starting = signal(false);

  private readonly offsetMs = signal(0);
  private readonly tick = signal(Date.now());

  protected readonly retakeMs = computed(() => {
    const retakeAt = this.result()?.retakeAvailableAtUtc;
    return retakeAt ? parseUtc(retakeAt) - (this.tick() + this.offsetMs()) : 0;
  });
  protected readonly retakeLabel = computed(() => formatCountdown(this.retakeMs()));
  protected readonly canRetake = computed(() => this.retakeMs() <= 0);

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.tick.set(Date.now()));

    const id = this.route.snapshot.paramMap.get('id') ?? '';

    this.api.result(id).subscribe({
      next: (result) => {
        this.offsetMs.set(clockOffsetMs(result.serverNowUtc));
        this.result.set(result);
        this.loading.set(false);
        this.auth.loadProfile().subscribe({ error: () => undefined });
        this.learning.refresh().subscribe({ error: () => undefined });
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  protected retake(code: CefrLevel | null): void {
    if (!code) {
      return;
    }

    this.starting.set(true);
    this.error.set(null);

    this.api.startLevel(code).subscribe({
      next: (session) => void this.router.navigate(['/exams/take', session.attemptId]),
      error: (e: unknown) => {
        this.starting.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }
}