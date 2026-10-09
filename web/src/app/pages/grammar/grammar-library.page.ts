import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { toApiError } from '../../core/models/api-error.model';
import { CefrLevel } from '../../domain/enums/user.enums';
import { GrammarSummary } from '../../models/grammar/grammar.models';
import { GrammarApiService } from '../../services/grammar/grammar-api.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'dm-grammar-library-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <section class="page">
      <a class="back-link" routerLink="/learn"><dm-icon name="arrow-left" /> Learning path</a>

      <div class="page-head">
        <div>
          <p class="eyebrow">Library</p>
          <h1 class="hello">Grammar</h1>
        </div>
      </div>

      <form class="toolbar" [formGroup]="form" (submit)="$event.preventDefault()">
        <div class="search-box">
          <dm-icon name="search" />
          <input class="input" type="search" formControlName="search" placeholder="Search grammar topics" autocomplete="off" aria-label="Search grammar" />
        </div>
        <div class="filters one">
          <select class="input" formControlName="level" aria-label="Level">
            <option value="">All levels</option>
            @for (level of levels; track level) {
              <option [value]="level">{{ level }}</option>
            }
          </select>
        </div>
      </form>

      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }

      <p class="muted count">{{ total() }} {{ total() === 1 ? 'topic' : 'topics' }}</p>

      @if (items().length) {
        <div class="card-grid">
          @for (topic of items(); track topic.id) {
            <a class="card topic" [routerLink]="['/grammar', topic.id]">
              <span class="row">
                <span class="badge">{{ topic.level }}</span>
                <span class="eyebrow">{{ topic.lessonTitle }}</span>
              </span>
              <h3>{{ topic.title }}</h3>
              <p class="muted">{{ topic.summary }}</p>
            </a>
          }
        </div>
      } @else if (!loading()) {
        <p class="empty">No grammar topics found. Finish more lessons to unlock more.</p>
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
  styles: [
    `
      .count { margin-bottom: 0.75rem; }
      .filters.one { grid-template-columns: 1fr; max-width: 260px; }
      .topic { display: grid; gap: 0.5rem; text-decoration: none; }
      .topic:hover { border-color: var(--ink); }
      .topic h3 { font-size: 1.7rem; }
      .row { display: flex; align-items: center; gap: 0.6rem; }
    `
  ]
})
export class GrammarLibraryPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(GrammarApiService);
  private requestId = 0;

  protected readonly levels = Object.values(CefrLevel);
  protected readonly form = this.fb.group({ search: [''], level: [''] });

  protected readonly items = signal<GrammarSummary[]>([]);
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
      .search({ search: value.search.trim(), level: value.level as CefrLevel | '', page, pageSize: 20 })
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
}