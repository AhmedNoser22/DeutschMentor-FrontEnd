import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toApiError } from '../../core/models/api-error.model';
import { ReviewRating } from '../../domain/enums/progress.enums';
import { ReviewCard } from '../../models/review/review.models';
import { ReviewApiService } from '../../services/review/review-api.service';
import { IconComponent } from '../../shared/components/icon.component';
import { ReviewStore } from '../../state/review/review.store';

@Component({
  selector: 'dm-review-page',
  imports: [RouterLink, IconComponent],
  host: { '(window:keydown)': 'onKey($event)' },
  template: `
    <section class="page narrow">
      <p class="eyebrow">Spaced review</p>

      @if (loading()) {
        <h1 class="hello">Loading cards...</h1>
      } @else if (error() && !current()) {
        <h1 class="hello">Review</h1>
        <div class="alert alert-error" role="alert">{{ error() }}</div>
        <button class="btn btn-outline" type="button" (click)="load()">Try again</button>
      } @else if (finished()) {
        <h1 class="hello">All caught up</h1>
        <article class="card done">
          <p class="count">{{ reviewed() }}</p>
          <p class="muted">{{ reviewed() === 1 ? 'card' : 'cards' }} reviewed in this session.</p>
          @if (remaining() > 0) {
            <p>{{ remaining() }} more {{ remaining() === 1 ? 'card is' : 'cards are' }} due.</p>
          }
          <div class="actions">
            @if (remaining() > 0) {
              <button class="btn btn-primary" type="button" (click)="load()">Review more</button>
            }
            <a class="btn btn-outline" routerLink="/today">Back to Today</a>
          </div>
        </article>
      } @else if (!current()) {
        <h1 class="hello">No cards due</h1>
        <article class="card done">
          <p class="muted">Add words from your lessons with "Add to review" and they will show up here at the right time.</p>
          <div class="actions">
            <a class="btn btn-primary" routerLink="/vocabulary">Open vocabulary</a>
            <a class="btn btn-outline" routerLink="/today">Back to Today</a>
          </div>
        </article>
      } @else if (current(); as card) {
        <h1 class="hello">{{ total() }} {{ total() === 1 ? 'card' : 'cards' }} due</h1>

        <div class="meter">
          <div class="progress"><span [style.width.%]="percent()"></span></div>
          <span class="muted">Card {{ index() + 1 }} of {{ cards().length }}</span>
        </div>

        <article class="card face">
          <header>
            @if (card.article; as article) {
              <span [class]="'badge art-' + article.toLowerCase()">{{ article.toLowerCase() }}</span>
            } @else {
              <span class="badge">{{ card.partOfSpeech }}</span>
            }
            <h2>{{ card.german }}</h2>
          </header>

          @if (revealed()) {
            <div class="answer">
              <p class="en">{{ card.english }}</p>
              <p class="ar" lang="ar" dir="rtl">{{ card.arabic }}</p>
              <div class="example">
                <p>{{ card.exampleGerman }}</p>
                <p class="muted">{{ card.exampleEnglish }}</p>
              </div>
            </div>
          } @else {
            <button class="btn btn-dark show" type="button" (click)="reveal()">Show answer</button>
          }
        </article>

        @if (error()) {
          <div class="alert alert-error" role="alert">{{ error() }}</div>
        }

        @if (revealed()) {
          <div class="ratings" role="group" aria-label="How well did you remember this word?">
            <button class="rate again" type="button" [disabled]="busy()" (click)="rate(Rating.Again)">
              <strong>Again</strong><small>{{ days(card.intervals.again) }}</small>
            </button>
            <button class="rate" type="button" [disabled]="busy()" (click)="rate(Rating.Hard)">
              <strong>Hard</strong><small>{{ days(card.intervals.hard) }}</small>
            </button>
            <button class="rate" type="button" [disabled]="busy()" (click)="rate(Rating.Good)">
              <strong>Good</strong><small>{{ days(card.intervals.good) }}</small>
            </button>
            <button class="rate" type="button" [disabled]="busy()" (click)="rate(Rating.Easy)">
              <strong>Easy</strong><small>{{ days(card.intervals.easy) }}</small>
            </button>
          </div>
        }
      }
    </section>
  `,
  styles: [
    `
      .meter { display: grid; gap: 0.4rem; margin-bottom: 1rem; }
      .face { display: grid; gap: 1.25rem; min-height: 260px; align-content: start; }
      .face header { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; padding-bottom: 1rem; border-bottom: 1px solid var(--line); }
      .face h2 { font-size: clamp(2.6rem, 10vw, 4rem); }
      .art-der { background: var(--art-der-bg); color: var(--art-der-ink); }
      .art-die { background: var(--art-die-bg); color: var(--art-die-ink); }
      .art-das { background: var(--art-das-bg); color: var(--art-das-ink); }
      .answer { display: grid; gap: 0.6rem; }
      .en { font-size: 1.3rem; }
      .ar { font-size: 1.4rem; }
      .example { padding-top: 0.75rem; margin-top: 0.25rem; border-top: 1px solid var(--line); }
      .show { justify-self: start; }
      .ratings { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; margin-top: 1rem; }
      .rate {
        display: grid;
        gap: 0.1rem;
        min-height: 64px;
        padding: 0.5rem;
        text-align: center;
        background: var(--surface);
        border: 1.5px solid var(--line-strong);
        border-radius: var(--radius-md);
        cursor: pointer;
      }
      .rate small { color: var(--muted); }
      .rate.again strong { color: var(--primary); }
      .rate:disabled { opacity: 0.55; cursor: not-allowed; }
      .done { display: grid; gap: 0.75rem; }
      .count { font-family: var(--font-display); font-size: 5rem; font-weight: 700; line-height: 0.95; }
      .actions { display: flex; flex-wrap: wrap; gap: 0.6rem; }
      .alert { margin-top: 1rem; }
      @media (min-width: 600px) {
        .ratings { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      }
    `
  ]
})
export class ReviewPage {
  private readonly api = inject(ReviewApiService);
  private readonly store = inject(ReviewStore);

  protected readonly Rating = ReviewRating;
  protected readonly cards = signal<ReviewCard[]>([]);
  protected readonly index = signal(0);
  protected readonly revealed = signal(false);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly reviewed = signal(0);
  protected readonly total = signal(0);
  protected readonly remaining = signal(0);
  protected readonly finished = signal(false);

  protected readonly current = computed(() => (this.finished() ? null : (this.cards()[this.index()] ?? null)));
  protected readonly percent = computed(() =>
    this.cards().length ? (this.index() / this.cards().length) * 100 : 0
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.finished.set(false);

    this.api.queue().subscribe({
      next: (queue) => {
        this.cards.set(queue.cards);
        this.total.set(queue.totalDue);
        this.remaining.set(queue.totalDue);
        this.index.set(0);
        this.revealed.set(false);
        this.reviewed.set(0);
        this.store.setDue(queue.totalDue);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  protected reveal(): void {
    this.revealed.set(true);
  }

  protected rate(rating: ReviewRating): void {
    const card = this.current();
    if (!card || !this.revealed() || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.error.set(null);

    this.api.rate(card.reviewItemId, rating).subscribe({
      next: (result) => {
        this.busy.set(false);
        this.reviewed.update((value) => value + 1);
        this.remaining.set(result.dueRemaining);
        this.store.setDue(result.dueRemaining);
        this.revealed.set(false);

        if (this.index() + 1 >= this.cards().length) {
          this.finished.set(true);
        } else {
          this.index.update((value) => value + 1);
        }
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  protected days(value: number): string {
    return value === 1 ? '1 day' : `${value} days`;
  }

  onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      return;
    }

    if (!this.current()) {
      return;
    }

    if (!this.revealed()) {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this.reveal();
      }
      return;
    }

    const map: Record<string, ReviewRating> = {
      '1': ReviewRating.Again,
      '2': ReviewRating.Hard,
      '3': ReviewRating.Good,
      '4': ReviewRating.Easy
    };

    const rating = map[event.key];
    if (rating) {
      this.rate(rating);
    }
  }
}