import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AchievementListComponent } from '../../components/progress/achievement-list.component';
import { ContinueCardComponent } from '../../components/progress/continue-card.component';
import { DailyPlanComponent } from '../../components/progress/daily-plan.component';
import { MentorCardComponent } from '../../components/progress/mentor-card.component';
import { WeekStripComponent } from '../../components/progress/week-strip.component';
import { toApiError } from '../../core/models/api-error.model';
import { LevelStatus } from '../../domain/enums/learning.enums';
import { CefrLevel, StartPreference } from '../../domain/enums/user.enums';
import { Today } from '../../models/progress/progress.models';
import { ProgressApiService } from '../../services/progress/progress-api.service';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthStore } from '../../state/auth/auth.store';
import { LearningStore } from '../../state/learning/learning.store';
import { ReviewStore } from '../../state/review/review.store';

const LEVEL_ORDER: readonly CefrLevel[] = [CefrLevel.A1, CefrLevel.A2, CefrLevel.B1, CefrLevel.B2, CefrLevel.C1];

@Component({
  selector: 'dm-dashboard-page',
  imports: [
    RouterLink,
    IconComponent,
    ContinueCardComponent,
    DailyPlanComponent,
    MentorCardComponent,
    WeekStripComponent,
    AchievementListComponent
  ],
  template: `
    <section class="page">
      <div class="head">
        <div>
          <p class="eyebrow">{{ dateLabel }}</p>
          <h1 class="hello">{{ greeting }}, {{ firstName() }}.</h1>
        </div>
        @if (today(); as t) {
          <span class="streak" [class.on]="t.streak.studiedToday">
            <dm-icon name="flame" /> <strong>{{ t.streak.current }}</strong> day streak
          </span>
        }
      </div>

      @if (user()?.placementAvailable) {
        <article class="card stack placement">
          <p class="eyebrow">Placement test</p>
          <h2>Find your level</h2>
          <p class="muted">Answer a short test and begin at the level your answers show. It is offered once.</p>
          <div><a class="btn btn-primary" routerLink="/exams">Take the placement test</a></div>
        </article>
      }

      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
        <button class="btn btn-outline" type="button" (click)="load()">Try again</button>
      }

      @if (today(); as t) {
        <div class="dash">
          <div class="col">
            <div class="o1"><dm-continue-card [lesson]="t.continue" [level]="learning.activeLevel()" /></div>
            <div class="o3"><dm-daily-plan [plan]="t.plan" /></div>

            @if (learning.activeLevel(); as level) {
              <article class="card level o7">
                <div class="level-head">
                  <h2>Level {{ level.code }} · {{ level.title }}</h2>
                  <span class="badge badge-danger">{{ level.status === LevelStatus.Passed ? 'Passed' : 'In progress' }}</span>
                </div>
                <div class="progress"><span [style.width.%]="levelPercent()"></span></div>
                <p class="muted">{{ level.completedLessons }} of {{ level.totalLessons }} lessons finished</p>
                <p class="note">
                  <dm-icon name="lock" />
                  @if (level.completedLessons < level.totalLessons) {
                    The {{ level.code }} exam opens after all {{ level.totalLessons }} lessons. You need 70% to pass{{ nextLevel() ? ' and unlock ' + nextLevel() : '' }}.
                  } @else {
                    All lessons are finished. Take the {{ level.code }} exam to continue.
                  }
                </p>
                <div><a class="btn btn-outline" routerLink="/learn">Open learning path</a></div>
              </article>
            }
          </div>

          <div class="col">
            <div class="o2"><dm-mentor-card [messages]="t.mentor" /></div>

            <article class="card review o4">
              <p class="eyebrow">Spaced review</p>
              <p class="big">{{ t.review.dueCount }}</p>
              @if (t.review.dueCount > 0) {
                <p class="muted">{{ t.review.dueCount === 1 ? 'card is' : 'cards are' }} due today. About {{ t.review.estimatedMinutes }} {{ t.review.estimatedMinutes === 1 ? 'minute' : 'minutes' }}.</p>
                <div><a class="btn btn-dark" routerLink="/review">Start review</a></div>
              } @else {
                <p class="muted">Nothing is due. Add words from your lessons to start reviewing.</p>
                <div><a class="btn btn-outline" routerLink="/vocabulary">Open vocabulary</a></div>
              }
            </article>

            <div class="o5"><dm-week-strip [week]="t.week" /></div>

            <article class="card o6">
              <div class="ach-head">
                <h2>Achievements</h2>
                <a class="link" routerLink="/achievements">See all</a>
              </div>
              <dm-achievement-list [items]="t.recentAchievements" />
            </article>
          </div>
        </div>
      } @else if (!error()) {
        <p class="muted">Loading your day...</p>
      }
    </section>
  `,
  styles: [
    `
      .head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 1rem; }
      .head .hello { margin-bottom: 1rem; }
      .streak {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.55rem 1rem;
        font-size: 1.05rem;
        background: var(--surface);
        border: 1.5px solid var(--line-strong);
        border-radius: var(--radius-sm);
      }
      .streak dm-icon { width: 1.3rem; height: 1.3rem; color: var(--muted); }
      .streak.on dm-icon { color: var(--primary); }
      .streak strong { font-family: var(--font-display); font-size: 1.6rem; line-height: 1; }
      .placement { margin-bottom: 1rem; border-color: var(--ink); }

      .dash { display: grid; gap: 1rem; }
      .col { display: contents; }
      .o1 { order: 1; } .o2 { order: 2; } .o3 { order: 3; } .o4 { order: 4; }
      .o5 { order: 5; } .o6 { order: 6; } .o7 { order: 7; }

      .level { display: grid; gap: 0.75rem; }
      .level-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; }
      .level-head h2 { font-size: 1.7rem; }
      .note { display: flex; align-items: flex-start; gap: 0.5rem; }
      .note dm-icon { flex: none; width: 1.15rem; height: 1.15rem; margin-top: 0.2rem; }
      .review { display: grid; gap: 0.5rem; }
      .review .big { font-family: var(--font-display); font-size: 5rem; font-weight: 700; line-height: 0.95; }
      .ach-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
      .ach-head h2 { font-size: 1.7rem; }

      @media (min-width: 1000px) {
        .dash { grid-template-columns: 1.6fr 1fr; align-items: start; }
        .col { display: grid; gap: 1rem; }
      }
    `
  ]
})
export class DashboardPage {
  private readonly store = inject(AuthStore);
  private readonly progressApi = inject(ProgressApiService);
  private readonly reviewStore = inject(ReviewStore);
  protected readonly learning = inject(LearningStore);

  protected readonly LevelStatus = LevelStatus;
  protected readonly user = this.store.user;
  protected readonly today = signal<Today | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly firstName = computed(() => (this.user()?.fullName ?? '').split(' ')[0]);
  protected readonly levelPercent = computed(() => {
    const level = this.learning.activeLevel();
    return level && level.totalLessons > 0 ? Math.round((level.completedLessons / level.totalLessons) * 100) : 0;
  });
  protected readonly nextLevel = computed(() => {
    const level = this.learning.activeLevel();
    if (!level) {
      return null;
    }
    return LEVEL_ORDER[LEVEL_ORDER.indexOf(level.code) + 1] ?? null;
  });

  protected readonly dateLabel = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
    .format(new Date())
    .toUpperCase();

  protected readonly greeting = this.greetingFor(new Date().getHours());

  protected readonly StartPreference = StartPreference;

  constructor() {
    this.load();
    this.learning.refresh().subscribe({ error: () => undefined });
  }

  protected load(): void {
    this.error.set(null);

    this.progressApi.today().subscribe({
      next: (today) => {
        this.today.set(today);
        this.reviewStore.setDue(today.review.dueCount);
      },
      error: (e: unknown) => this.error.set(toApiError(e).message)
    });
  }

  private greetingFor(hour: number): string {
    if (hour < 11) {
      return 'Guten Morgen';
    }
    return hour < 18 ? 'Guten Tag' : 'Guten Abend';
  }
}