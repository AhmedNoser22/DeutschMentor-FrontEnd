import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toApiError } from '../../core/models/api-error.model';
import { Achievement } from '../../models/progress/progress.models';
import { ProgressApiService } from '../../services/progress/progress-api.service';
import { IconComponent, IconName } from '../../shared/components/icon.component';

const ICONS: Readonly<Record<string, IconName>> = {
  award: 'award',
  book: 'book',
  flame: 'flame',
  review: 'review'
};

@Component({
  selector: 'dm-achievements-page',
  imports: [DatePipe, RouterLink, IconComponent],
  template: `
    <section class="page">
      <a class="back-link" routerLink="/today"><dm-icon name="arrow-left" /> Today</a>

      <div class="page-head">
        <div>
          <p class="eyebrow">Progress</p>
          <h1 class="hello">Achievements</h1>
        </div>
        <p class="muted">{{ unlockedCount() }} of {{ items().length }} unlocked</p>
      </div>

      @if (loading()) {
        <p class="muted">Loading achievements...</p>
      } @else if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
        <button class="btn btn-outline" type="button" (click)="load()">Try again</button>
      } @else {
        <div class="card-grid three">
          @for (item of sorted(); track item.code) {
            <article class="card item" [class.locked]="!item.unlocked">
              <span [class]="'ico ' + item.icon" aria-hidden="true"><dm-icon [name]="iconFor(item.icon)" /></span>
              <h2>{{ item.title }}</h2>

              @if (item.unlocked) {
                <p class="muted">{{ item.detail }}</p>
                <p class="when">{{ item.unlockedAtUtc | date: 'd MMM y' : 'UTC' }}</p>
              } @else {
                <p class="muted">{{ item.description }}</p>
                <div class="progress"><span [style.width.%]="percent(item)"></span></div>
                <p class="when">{{ item.current }} of {{ item.target }}</p>
              }
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .item { display: grid; gap: 0.5rem; align-content: start; }
      .item h2 { font-size: 1.6rem; }
      .item.locked { background: transparent; border-style: dashed; }
      .item.locked .ico { filter: grayscale(1); opacity: 0.6; }
      .ico { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 10px; }
      .ico dm-icon { width: 1.6rem; height: 1.6rem; }
      .ico.award { color: #14171c; background: var(--gold); }
      .ico.book { color: var(--art-der-ink); background: var(--art-der-bg); }
      .ico.flame { color: var(--primary); background: var(--primary-soft); }
      .ico.review { color: var(--success); background: var(--success-soft); }
      .when { font-size: 0.9rem; font-weight: 500; color: var(--ink-soft); }
    `
  ]
})
export class AchievementsPage {
  private readonly api = inject(ProgressApiService);

  protected readonly items = signal<Achievement[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly unlockedCount = computed(() => this.items().filter((item) => item.unlocked).length);
  protected readonly sorted = computed(() =>
    [...this.items()].sort((a, b) => {
      if (a.unlocked !== b.unlocked) {
        return a.unlocked ? -1 : 1;
      }
      if (a.unlocked && b.unlocked) {
        return (b.unlockedAtUtc ?? '').localeCompare(a.unlockedAtUtc ?? '');
      }
      return b.current / b.target - a.current / a.target;
    })
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.achievements().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  protected iconFor(name: string): IconName {
    return ICONS[name] ?? 'award';
  }

  protected percent(item: Achievement): number {
    return item.target > 0 ? Math.min(100, Math.round((item.current / item.target) * 100)) : 0;
  }
}