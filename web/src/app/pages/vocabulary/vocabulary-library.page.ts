import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Params, RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { WordCardComponent } from '../../components/vocabulary/word-card.component';
import { toApiError } from '../../core/models/api-error.model';
import { Article, PartOfSpeech } from '../../domain/enums/learning.enums';
import { CefrLevel } from '../../domain/enums/user.enums';
import { VocabularyItem } from '../../models/vocabulary/vocabulary.models';
import { VocabularyApiService } from '../../services/vocabulary/vocabulary-api.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'dm-vocabulary-library-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, WordCardComponent],
  template: `
    <section class="page">
      <a class="back-link" routerLink="/learn"><dm-icon name="arrow-left" /> Learning path</a>

      <div class="page-head">
        <div>
          <p class="eyebrow">Library</p>
          <h1 class="hello">Vocabulary</h1>
        </div>
        <a class="btn btn-dark" routerLink="/vocabulary/flashcards" [queryParams]="flashParams()">
          <dm-icon name="review" /> Flashcards
        </a>
      </div>

      <form class="toolbar" [formGroup]="form" (submit)="$event.preventDefault()">
        <div class="search-box">
          <dm-icon name="search" />
          <input class="input" type="search" formControlName="search" placeholder="Search German, English or Arabic" autocomplete="off" aria-label="Search words" />
        </div>
        <div class="filters">
          <select class="input" formControlName="level" aria-label="Level">
            <option value="">All levels</option>
            @for (level of levels; track level) {
              <option [value]="level">{{ level }}</option>
            }
          </select>
          <select class="input" formControlName="partOfSpeech" aria-label="Word type">
            <option value="">All types</option>
            @for (type of types; track type) {
              <option [value]="type">{{ type }}</option>
            }
          </select>
          <select class="input" formControlName="article" aria-label="Article">
            <option value="">All articles</option>
            @for (article of articles; track article) {
              <option [value]="article">{{ article.toLowerCase() }}</option>
            }
          </select>
        </div>
      </form>

      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }

      <p class="muted count">{{ total() }} {{ total() === 1 ? 'word' : 'words' }}</p>

      @if (items().length) {
        <div class="card-grid three">
          @for (item of items(); track item.id) {
            <dm-word-card [item]="item" />
          }
        </div>
      } @else if (!loading()) {
        <p class="empty">No words found. Finish more lessons to unlock more words.</p>
      }

      @if (hasMore()) {
        <div class="load-more">
          <button class="btn btn-outline" type="button" [disabled]="loading()" (click)="load(false)">
            {{ loading() ? 'Loading...' : 'Load more' }}
          </button>
        </div>
      }
    </section>
  `,
  styles: [`.count { margin-bottom: 0.75rem; }`]
})
export class VocabularyLibraryPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(VocabularyApiService);
  private requestId = 0;

  protected readonly levels = Object.values(CefrLevel);
  protected readonly types = Object.values(PartOfSpeech);
  protected readonly articles = Object.values(Article);

  protected readonly form = this.fb.group({
    search: [''],
    level: [''],
    partOfSpeech: [''],
    article: ['']
  });

  protected readonly items = signal<VocabularyItem[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly hasMore = computed(() => this.items().length < this.total());

  constructor() {
    this.form.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.load(true));
    this.load(true);
  }

  protected load(reset: boolean): void {
    const page = reset ? 1 : this.page() + 1;
    const value = this.form.getRawValue();
    const id = ++this.requestId;

    this.loading.set(true);
    this.error.set(null);

    this.api
      .search({
        search: value.search.trim(),
        level: value.level as CefrLevel | '',
        partOfSpeech: value.partOfSpeech as PartOfSpeech | '',
        article: value.article as Article | '',
        page,
        pageSize: 20
      })
      .subscribe({
        next: (result) => {
          if (id !== this.requestId) {
            return;
          }
          this.items.update((current) => (reset ? result.items : [...current, ...result.items]));
          this.total.set(result.total);
          this.page.set(result.page);
          this.loading.set(false);
        },
        error: (e: unknown) => {
          if (id !== this.requestId) {
            return;
          }
          this.loading.set(false);
          this.error.set(toApiError(e).message);
        }
      });
  }

  protected flashParams(): Params {
    const value = this.form.getRawValue();
    const params: Params = {};
    if (value.search.trim()) {
      params['search'] = value.search.trim();
    }
    if (value.level) {
      params['level'] = value.level;
    }
    if (value.partOfSpeech) {
      params['partOfSpeech'] = value.partOfSpeech;
    }
    if (value.article) {
      params['article'] = value.article;
    }
    return params;
  }
}