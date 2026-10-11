import { formatDate } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { toApiError } from '../../core/models/api-error.model';
import { clockOffsetMs, formatCountdown, parseUtc } from '../../core/services/clock';
import { ExamAvailability } from '../../domain/enums/exam.enums';
import { CefrLevel } from '../../domain/enums/user.enums';
import { ExamLevelRow, ExamOverview } from '../../models/exams/exam.models';
import { ExamApiService } from '../../services/exams/exam-api.service';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthStore } from '../../state/auth/auth.store';

@Component({
  selector: 'dm-exams-page',
  imports: [RouterLink, IconComponent],
  template: `
    <section class="page">
      <p class="eyebrow">Level exams</p>
      <h1 class="hello">Exams</h1>

      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
        <button class="btn btn-outline" type="button" (click)="load()">Try again</button>
      }

      @if (overview(); as o) {
        @if (o.placement.available) {
          <article class="card placement">
            <div>
              <p class="eyebrow">Placement test</p>
              <h2>Find your level</h2>
              <p class="muted">
                About {{ o.placement.minutes }} minutes. You begin at the level your answers show. It is offered once.
              </p>
            </div>

            @if (confirmSkip()) {
              <div class="confirm">
                <p>Skip the placement test and start at A1? You cannot take it later.</p>
                <div class="row-actions">
                  <button class="btn btn-dark" type="button" [disabled]="busy() !== null" (click)="skipPlacement()">Yes, start at A1</button>
                  <button class="btn btn-outline" type="button" (click)="confirmSkip.set(false)">Cancel</button>
                </div>
              </div>
            } @else {
              <div class="row-actions">
                <button class="btn btn-primary" type="button" [disabled]="busy() !== null" (click)="startPlacement()">
                  {{ o.placement.inProgressAttemptId ? 'Resume placement test' : busy() === 'placement' ? 'Starting...' : 'Start placement test' }}
                </button>
                @if (!o.placement.inProgressAttemptId) {
                  <button class="btn btn-outline" type="button" (click)="confirmSkip.set(true)">Start at A1 instead</button>
                }
              </div>
            }
          </article>
        }

        <div class="layout">
          <section class="card list" aria-label="Level exams">
            <ul class="rows">
              @for (row of o.levels; track row.code) {
                <li class="row" [class.dim]="dimmed(row)">
                  <div class="main">
                    <span [class]="'code ' + tone(row)">{{ row.code }}</span>
                    <span class="info">
                      <strong>{{ row.code }} exam</strong>
                      <small>{{ caption(row) }}</small>
                    </span>
                    <span class="actions">
                      @switch (row.availability) {
                        @case (Availability.Passed) {
                          <span class="badge badge-success"><dm-icon name="check" /> Passed</span>
                          @if (row.certificateId) {
                            <a class="btn btn-outline" routerLink="/certificates" [queryParams]="{ level: row.code }">Certificate</a>
                          }
                        }
                        @case (Availability.Ready) {
                          <button class="btn btn-primary" type="button" [disabled]="busy() !== null" (click)="confirmCode.set(row.code)">Start exam</button>
                        }
                        @case (Availability.InProgress) {
                          <button class="btn btn-primary" type="button" (click)="open(row.inProgressAttemptId)">Resume exam</button>
                        }
                        @case (Availability.Cooldown) {
                          <span class="badge badge-gold"><dm-icon name="clock" /> {{ countdown(row) }}</span>
                          <button class="btn btn-outline" type="button" disabled>Retake</button>
                        }
                        @case (Availability.LessonsRemaining) {
                          <span class="badge"><dm-icon name="lock" /> Locked</span>
                          <a class="btn btn-outline" routerLink="/learn" [queryParams]="{ level: row.code }">Lessons</a>
                        }
                        @case (Availability.LevelLocked) {
                          <span class="badge"><dm-icon name="lock" /> Locked</span>
                        }
                        @case (Availability.NotPublished) {
                          <span class="badge">Coming soon</span>
                        }
                      }
                    </span>
                  </div>

                  @if (confirmCode() === row.code) {
                    <div class="confirm">
                      <p>The timer starts as soon as you begin and cannot be paused. You can leave and resume until time runs out.</p>
                      <div class="row-actions">
                        <button class="btn btn-primary" type="button" [disabled]="busy() !== null" (click)="startLevel(row.code)">
                          {{ busy() === row.code ? 'Starting...' : 'Start now' }}
                        </button>
                        <button class="btn btn-outline" type="button" (click)="confirmCode.set(null)">Cancel</button>
                      </div>
                    </div>
                  }
                </li>
              }
            </ul>
          </section>

          <aside class="card how">
            <h2>How exams work</h2>
            <ul class="checks">
              <li><dm-icon name="check" /> Finish every lesson in the level first.</li>
              <li><dm-icon name="check" /> The pass mark is {{ o.passMarkPercent }}%.</li>
              <li><dm-icon name="check" /> If you do not pass, you can retake the exam after {{ o.retakeCooldownHours }} hours.</li>
              <li><dm-icon name="check" /> Passing issues your certificate and opens the next level.</li>
              <li><dm-icon name="check" /> The placement test is offered once, when you create your account.</li>
            </ul>
          </aside>
        </div>
      } @else if (!error()) {
        <p class="muted">Loading exams...</p>
      }
    </section>
  `,
  styles: [
    `
      .placement { display: grid; gap: 1rem; margin-bottom: 1rem; border-color: var(--ink); }
      .placement h2 { margin: 0.15rem 0 0.35rem; font-size: 1.9rem; }
      .layout { display: grid; gap: 1rem; align-items: start; }
      .rows { display: grid; margin: 0; padding: 0; list-style: none; }
      .row { padding: 1rem 0; border-bottom: 1px solid var(--line); }
      .row:first-child { padding-top: 0; }
      .row:last-child { padding-bottom: 0; border-bottom: 0; }
      .row.dim .info { opacity: 0.7; }
      .main { display: flex; flex-wrap: wrap; align-items: center; gap: 0.9rem; }
      .code {
        display: grid;
        place-items: center;
        flex: none;
        width: 52px;
        height: 52px;
        border-radius: 8px;
        font-family: var(--font-display);
        font-size: 1.5rem;
        font-weight: 700;
      }
      .code.passed { background: var(--ink); color: var(--bg); }
      .code.active { background: var(--primary); color: var(--primary-ink); }
      .code.idle { background: var(--surface-2); color: var(--muted); }
      .info { display: grid; flex: 1 1 12rem; min-width: 0; line-height: 1.3; }
      .info strong { font-size: 1.1rem; }
      .info small { color: var(--muted); }
      .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
      .actions .btn { min-height: 44px; }
      .actions dm-icon, .badge dm-icon { width: 1rem; height: 1rem; }
      .confirm { display: grid; gap: 0.75rem; padding: 1rem; margin-top: 0.9rem; background: var(--surface-2); border-radius: var(--radius-md); }
      .row-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; }
      .how h2 { margin-bottom: 0.9rem; font-size: 1.7rem; }
      .checks { display: grid; gap: 0.8rem; margin: 0; padding: 0; list-style: none; }
      .checks li { display: flex; align-items: flex-start; gap: 0.6rem; }
      .checks dm-icon { flex: none; width: 1.25rem; height: 1.25rem; margin-top: 0.15rem; color: var(--primary); }
      @media (min-width: 900px) {
        .layout { grid-template-columns: 1.6fr 1fr; }
      }
    `
  ]
})
export class ExamsPage {
  private readonly api = inject(ExamApiService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);

  protected readonly Availability = ExamAvailability;
  protected readonly overview = signal<ExamOverview | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal<string | null>(null);
  protected readonly confirmCode = signal<CefrLevel | null>(null);
  protected readonly confirmSkip = signal(false);

  private readonly offsetMs = signal(0);
  private readonly tick = signal(Date.now());
  private readonly nowMs = computed(() => this.tick() + this.offsetMs());
  private reloading = false;

  constructor() {
    this.load();

    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.tick.set(Date.now());
        if (!this.reloading && this.hasEndedCooldown()) {
          this.reloading = true;
          this.load();
        }
      });
  }

  protected load(): void {
    this.error.set(null);

    this.api.overview().subscribe({
      next: (overview) => {
        this.offsetMs.set(clockOffsetMs(overview.serverNowUtc));
        this.overview.set(overview);
        this.reloading = false;
      },
      error: (e: unknown) => {
        this.reloading = false;
        this.error.set(toApiError(e).message);
      }
    });
  }

  protected startLevel(code: CefrLevel): void {
    this.busy.set(code);
    this.error.set(null);

    this.api.startLevel(code).subscribe({
      next: (session) => void this.router.navigate(['/exams/take', session.attemptId]),
      error: (e: unknown) => {
        this.busy.set(null);
        this.confirmCode.set(null);
        this.error.set(toApiError(e).message);
        this.load();
      }
    });
  }

  protected startPlacement(): void {
    const running = this.overview()?.placement.inProgressAttemptId;
    if (running) {
      this.open(running);
      return;
    }

    this.busy.set('placement');
    this.error.set(null);

    this.api.startPlacement().subscribe({
      next: (session) => void this.router.navigate(['/exams/take', session.attemptId]),
      error: (e: unknown) => {
        this.busy.set(null);
        this.error.set(toApiError(e).message);
        this.load();
      }
    });
  }

  protected skipPlacement(): void {
    this.busy.set('placement');
    this.error.set(null);

    this.api.skipPlacement().subscribe({
      next: () => {
        this.busy.set(null);
        this.confirmSkip.set(false);
        this.auth.loadProfile().subscribe({ error: () => undefined });
        this.load();
      },
      error: (e: unknown) => {
        this.busy.set(null);
        this.error.set(toApiError(e).message);
      }
    });
  }

  protected open(attemptId: string | null): void {
    if (attemptId) {
      void this.router.navigate(['/exams/take', attemptId]);
    }
  }

  protected tone(row: ExamLevelRow): string {
    switch (row.availability) {
      case ExamAvailability.Passed:
        return 'passed';
      case ExamAvailability.Ready:
      case ExamAvailability.InProgress:
      case ExamAvailability.Cooldown:
        return 'active';
      default:
        return 'idle';
    }
  }

  protected dimmed(row: ExamLevelRow): boolean {
    return row.availability === ExamAvailability.LevelLocked || row.availability === ExamAvailability.NotPublished;
  }

  protected caption(row: ExamLevelRow): string {
    switch (row.availability) {
      case ExamAvailability.Passed:
        if (row.passedByPlacement) {
          return 'Passed through the placement test';
        }
        return row.passedAtUtc
          ? `Passed ${row.passedScorePercent ?? 0}% on ${this.dateOf(row.passedAtUtc)}`
          : `Passed ${row.passedScorePercent ?? 0}%`;
      case ExamAvailability.Ready:
        return `All lessons finished. Pass mark ${row.passMarkPercent}%.`;
      case ExamAvailability.InProgress:
        return 'Exam in progress. Resume where you stopped.';
      case ExamAvailability.Cooldown:
        return 'You can retake this exam after the waiting time.';
      case ExamAvailability.LessonsRemaining:
        return row.lessonsRemaining > 0
          ? `${row.lessonsRemaining} ${row.lessonsRemaining === 1 ? 'lesson' : 'lessons'} left before you can start`
          : 'Lessons for this level are coming soon.';
      case ExamAvailability.LevelLocked:
        return `Opens after the ${row.opensAfterLevelCode} exam`;
      case ExamAvailability.NotPublished:
        return 'The exam is not published yet.';
      default:
        return '';
    }
  }

  protected countdown(row: ExamLevelRow): string {
    return row.retakeAvailableAtUtc ? formatCountdown(parseUtc(row.retakeAvailableAtUtc) - this.nowMs()) : '';
  }

  private dateOf(iso: string): string {
    return formatDate(iso, 'd MMM y', 'en-US', 'UTC');
  }

  private hasEndedCooldown(): boolean {
    const rows = this.overview()?.levels ?? [];
    return rows.some(
      (row) =>
        row.availability === ExamAvailability.Cooldown &&
        row.retakeAvailableAtUtc !== null &&
        parseUtc(row.retakeAvailableAtUtc) <= this.nowMs()
    );
  }
}