import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { toApiError } from '../../core/models/api-error.model';
import { Article, PartOfSpeech } from '../../domain/enums/learning.enums';
import { CefrLevel } from '../../domain/enums/user.enums';
import { VocabularyItem } from '../../models/vocabulary/vocabulary.models';
import { VocabularyApiService } from '../../services/vocabulary/vocabulary-api.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'dm-flashcards-page',
  imports: [RouterLink, IconComponent],
  host: { '(window:keydown)': 'onKey($event)' },
  template: `
    <section class="page narrow">
      <a class="back-link" [routerLink]="backLink()"><dm-icon name="arrow-left" /> Back</a>
      <p class="eyebrow">Flashcards</p>
      <h1 class="hello">Practice your words</h1>

      @if (loading()) {
        <p class="muted">Loading cards...</p>
      } @else if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      } @else if (current(); as card) {
        <div class="meta">
          <span class="muted">Card {{ index() + 1 }} of {{ cards().length }}</span>
          <button class="btn btn-outline small" type="button" (click)="shuffle()">Shuffle</button>
        </div>
        <div class="progress"><span [style.width.%]="percent()"></span></div>

        <button type="button" class="card flash" (click)="flip()" [attr.aria-label]="flipped() ? 'Show German' : 'Show translation'">
          @if (!flipped()) {
            <span class="front">
              @if (card.article; as article) {
                <span class="art">{{ article.toLowerCase() }}</span>
              }
              <span class="word">{{ card.german }}</span>
              <small class="muted">Tap to reveal</small>
            </span>
          } @else {
            <span class="back">
              <span class="en">{{ card.english }}</span>
              <span class="ar" lang="ar" dir="rtl">{{ card.arabic }}</span>
              <span class="ex">{{ card.exampleGerman }}</span>
              <small class="muted">{{ card.exampleEnglish }}</small>
            </span>
          }
        </button>

        <div class="actions">
          <button class="btn btn-outline" type="button" [disabled]="index() === 0" (click)="previous()">Previous</button>
          <button class="btn btn-outline" type="button" [class.added]="isReviewed(card)" (click)="toggleReview(card)">
            {{ isReviewed(card) ? 'Added to review' : 'Add to review' }}
          </button>
          <button class="btn btn-primary" type="button" (click)="advance()">{{ isLast() ? 'Restart' : 'Next' }}</button>
        </div>
      } @else {
        <p class="empty">No words to practise yet. Finish a lesson first.</p>
      }
    </section>
  `,
  styles: [
    `
      .meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; }
      .small { min-height: 36px; padding: 0 0.9rem; }
      .progress { margin-bottom: 1.25rem; }
      .flash {
        display: grid;
        place-items: center;
        width: 100%;
        min-height: 280px;
        padding: 1.5rem;
        text-align: center;
        cursor: pointer;
      }
      .front, .back { display: grid; gap: 0.6rem; justify-items: center; }
      .art { font-size: 1.2rem; font-weight: 600; color: var(--primary); }
      .word { font-family: var(--font-display); font-size: clamp(2.6rem, 9vw, 4rem); font-weight: 700; line-height: 1.05; }
      .en { font-size: 1.6rem; font-weight: 600; }
      .ar { font-size: 1.5rem; }
      .ex { padding-top: 0.75rem; margin-top: 0.25rem; border-top: 1px solid var(--line); }
      .actions { display: grid; grid-template-columns: 1fr; gap: 0.75rem; margin-top: 1.25rem; }
      .actions .added { background: var(--success-soft); border-color: var(--success); color: var(--success); }
      @media (min-width: 600px) {
        .actions { grid-template-columns: 1fr 1.4fr 1fr; }
      }
    `
  ]
})
export class FlashcardsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(VocabularyApiService);
  private readonly lessonId = this.route.snapshot.queryParamMap.get('lesson');

  protected readonly cards = signal<VocabularyItem[]>([]);
  protected readonly index = signal(0);
  protected readonly flipped = signal(false);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly reviewed = signal<ReadonlySet<string>>(new Set<string>());

  protected readonly current = computed(() => this.cards()[this.index()] ?? null);
  protected readonly isLast = computed(() => this.index() >= this.cards().length - 1);
  protected readonly percent = computed(() =>
    this.cards().length ? Math.round(((this.index() + 1) / this.cards().length) * 100) : 0
  );
  protected readonly backLink = computed(() =>
    this.lessonId ? ['/learn', 'lesson', this.lessonId] : ['/vocabulary']
  );

  constructor() {
    const query = this.route.snapshot.queryParamMap;

    const request$ = this.lessonId
      ? this.api.forLesson(this.lessonId)
      : this.api
          .search({
            search: query.get('search') ?? '',
            level: (query.get('level') ?? '') as CefrLevel | '',
            partOfSpeech: (query.get('partOfSpeech') ?? '') as PartOfSpeech | '',
            article: (query.get('article') ?? '') as Article | '',
            pageSize: 50
          })
          .pipe(map((result) => result.items));

    request$.subscribe({
      next: (items) => {
        this.cards.set(items);
        this.reviewed.set(new Set(items.filter((item) => item.inReview).map((item) => item.id)));
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  protected flip(): void {
    this.flipped.update((value) => !value);
  }

  protected next(): void {
    if (!this.isLast()) {
      this.index.update((value) => value + 1);
      this.flipped.set(false);
    }
  }

  protected previous(): void {
    if (this.index() > 0) {
      this.index.update((value) => value - 1);
      this.flipped.set(false);
    }
  }

  protected advance(): void {
    if (this.isLast()) {
      this.index.set(0);
      this.flipped.set(false);
    } else {
      this.next();
    }
  }

  protected shuffle(): void {
    const copy = [...this.cards()];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    this.cards.set(copy);
    this.index.set(0);
    this.flipped.set(false);
  }

  protected isReviewed(card: VocabularyItem): boolean {
    return this.reviewed().has(card.id);
  }

  protected toggleReview(card: VocabularyItem): void {
    const add = !this.isReviewed(card);
    this.setReviewed(card.id, add);

    const request = add ? this.api.addToReview(card.id) : this.api.removeFromReview(card.id);
    request.subscribe({ error: () => this.setReviewed(card.id, !add) });
  }

  onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      this.next();
    } else if (event.key === 'ArrowLeft') {
      this.previous();
    }
  }

  private setReviewed(id: string, value: boolean): void {
    this.reviewed.update((current) => {
      const next = new Set(current);
      if (value) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}