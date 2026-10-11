import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toApiError } from '../../core/models/api-error.model';
import { Article } from '../../domain/enums/learning.enums';
import { ArticleAnswerResult, ArticleDrillQuestion } from '../../models/drills/drill.models';
import { DrillApiService } from '../../services/drills/drill-api.service';

@Component({
  selector: 'dm-article-drill-page',
  imports: [RouterLink],
  template: `
    <section class="page narrow">
      <p class="eyebrow">Article drill</p>

      @if (loading()) {
        <h1 class="hello">Loading...</h1>
      } @else if (error() && !current() && !finished()) {
        <h1 class="hello">Article drill</h1>
        <div class="alert alert-error" role="alert">{{ error() }}</div>
        <a class="btn btn-outline" routerLink="/today">Back to Today</a>
      } @else if (finished()) {
        <h1 class="hello">{{ correct() }} of {{ questions().length }} right</h1>
        <article class="card done">
          <p class="muted">
            @if (correct() === questions().length) {
              Perfect round. Every article was right.
            } @else {
              The words you missed come back first next time.
            }
          </p>
          <div class="actions">
            <button class="btn btn-primary" type="button" (click)="load()">Practise again</button>
            <a class="btn btn-outline" routerLink="/today">Back to Today</a>
          </div>
        </article>
      } @else if (current(); as q) {
        <h1 class="hello">der, die or das?</h1>

        <div class="meter">
          <div class="progress"><span [style.width.%]="percent()"></span></div>
          <span class="muted">Word {{ index() + 1 }} of {{ questions().length }}</span>
        </div>

        <article class="card word">
          <h2>{{ q.german }}</h2>
          <p class="en">{{ q.english }}</p>
          <p class="ar" lang="ar" dir="rtl">{{ q.arabic }}</p>
        </article>

        <div class="choices" role="group" aria-label="Choose the article">
          @for (article of articles; track article) {
            <button
              type="button"
              [class]="'choice art-' + article.toLowerCase()"
              [class.right]="isRight(article)"
              [class.wrong]="isWrong(article)"
              [disabled]="!!result() || busy()"
              (click)="choose(q, article)"
            >
              {{ article.toLowerCase() }}
            </button>
          }
        </div>

        @if (error()) {
          <div class="alert alert-error" role="alert">{{ error() }}</div>
        }

        @if (result(); as r) {
          <div class="feedback" [class.good]="r.correct" [class.bad]="!r.correct" role="status">
            <strong>{{ r.correct ? 'Correct!' : 'Not quite.' }} {{ r.correctArticle.toLowerCase() }} {{ r.german }}</strong>
            <p>{{ r.exampleGerman }}</p>
            <p class="small">{{ r.exampleEnglish }}</p>
          </div>

          <button class="btn btn-primary" type="button" (click)="next()">
            {{ isLast() ? 'See result' : 'Next word' }}
          </button>
        }
      }
    </section>
  `,
  styles: [
    `
      .meter { display: grid; gap: 0.4rem; margin-bottom: 1rem; }
      .word { display: grid; gap: 0.4rem; justify-items: center; padding: 2rem 1rem; text-align: center; }
      .word h2 { font-size: clamp(3rem, 12vw, 4.6rem); }
      .en { font-size: 1.3rem; }
      .ar { font-size: 1.3rem; }
      .choices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; margin: 1rem 0; }
      .choice {
        min-height: 72px;
        font-family: var(--font-display);
        font-size: 2rem;
        font-weight: 700;
        border: 2px solid transparent;
        border-radius: var(--radius-md);
        cursor: pointer;
      }
      .choice:disabled { cursor: default; opacity: 0.6; }
      .choice.right { opacity: 1; border-color: var(--success); }
      .choice.wrong { opacity: 1; border-color: var(--danger); }
      .art-der { background: var(--art-der-bg); color: var(--art-der-ink); }
      .art-die { background: var(--art-die-bg); color: var(--art-die-ink); }
      .art-das { background: var(--art-das-bg); color: var(--art-das-ink); }
      .feedback { display: grid; gap: 0.3rem; padding: 1rem 1.1rem; margin-bottom: 1rem; border-radius: var(--radius-md); }
      .feedback.good { background: var(--success-soft); color: var(--success); }
      .feedback.bad { background: var(--danger-soft); color: var(--danger); }
      .feedback .small { font-size: 0.9rem; }
      .done { display: grid; gap: 0.75rem; }
      .actions { display: flex; flex-wrap: wrap; gap: 0.6rem; }
    `
  ]
})
export class ArticleDrillPage {
  private readonly api = inject(DrillApiService);

  protected readonly articles = [Article.Der, Article.Die, Article.Das];
  protected readonly questions = signal<ArticleDrillQuestion[]>([]);
  protected readonly index = signal(0);
  protected readonly result = signal<ArticleAnswerResult | null>(null);
  protected readonly chosen = signal<Article | null>(null);
  protected readonly correct = signal(0);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly finished = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly current = computed(() => this.questions()[this.index()] ?? null);
  protected readonly isLast = computed(() => this.index() >= this.questions().length - 1);
  protected readonly percent = computed(() =>
    this.questions().length ? (this.index() / this.questions().length) * 100 : 0
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.finished.set(false);

    this.api.articles().subscribe({
      next: (drill) => {
        this.questions.set(drill.questions);
        this.index.set(0);
        this.correct.set(0);
        this.result.set(null);
        this.chosen.set(null);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  protected choose(question: ArticleDrillQuestion, article: Article): void {
    if (this.result() || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    this.chosen.set(article);

    this.api.answerArticle(question.vocabularyItemId, article).subscribe({
      next: (result) => {
        this.busy.set(false);
        this.result.set(result);
        if (result.correct) {
          this.correct.update((value) => value + 1);
        }
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.chosen.set(null);
        this.error.set(toApiError(e).message);
      }
    });
  }

  protected next(): void {
    this.result.set(null);
    this.chosen.set(null);

    if (this.isLast()) {
      this.finished.set(true);
    } else {
      this.index.update((value) => value + 1);
    }
  }

  protected isRight(article: Article): boolean {
    return this.result()?.correctArticle === article;
  }

  protected isWrong(article: Article): boolean {
    const result = this.result();
    return !!result && !result.correct && this.chosen() === article;
  }
}