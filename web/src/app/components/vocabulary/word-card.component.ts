import { Component, inject, input, linkedSignal, signal } from '@angular/core';
import { VocabularyItem } from '../../models/vocabulary/vocabulary.models';
import { VocabularyApiService } from '../../services/vocabulary/vocabulary-api.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'dm-word-card',
  imports: [IconComponent],
  template: `
    <article class="word">
      <header>
        @if (item().article; as article) {
          <span [class]="'badge art-' + article.toLowerCase()">{{ article.toLowerCase() }}</span>
        } @else {
          <span class="badge">{{ item().partOfSpeech }}</span>
        }
        <h3>{{ item().german }}</h3>
      </header>

      <p class="en">{{ item().english }}</p>
      <p class="ar" lang="ar" dir="rtl">{{ item().arabic }}</p>

      <div class="example">
        <p>{{ item().exampleGerman }}</p>
        <p class="muted">{{ item().exampleEnglish }}</p>
      </div>

      <button type="button" class="btn btn-outline review" [class.added]="inReview()" [disabled]="busy()" (click)="toggle()">
        @if (inReview()) {
          <dm-icon name="check" /> Added to review
        } @else {
          Add to review
        }
      </button>
    </article>
  `,
  styles: [
    `
      :host { display: block; }
      .word { display: grid; gap: 0.5rem; height: 100%; padding: 1.25rem; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); }
      header { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
      h3 { font-size: 2rem; }
      .art-der { background: var(--art-der-bg); color: var(--art-der-ink); }
      .art-die { background: var(--art-die-bg); color: var(--art-die-ink); }
      .art-das { background: var(--art-das-bg); color: var(--art-das-ink); }
      .en { color: var(--ink-soft); }
      .ar { font-size: 1.15rem; }
      .example { padding-top: 0.75rem; margin-top: 0.25rem; border-top: 1px solid var(--line); }
      .example .muted { font-size: 0.9rem; }
      .review { align-self: end; justify-self: start; min-height: 42px; margin-top: 0.5rem; }
      .review.added { background: var(--success-soft); border-color: var(--success); color: var(--success); }
      .review dm-icon { width: 1.1rem; height: 1.1rem; }
    `
  ]
})
export class WordCardComponent {
  private readonly api = inject(VocabularyApiService);

  readonly item = input.required<VocabularyItem>();
  protected readonly inReview = linkedSignal(() => this.item().inReview);
  protected readonly busy = signal(false);

  protected toggle(): void {
    if (this.busy()) {
      return;
    }

    const next = !this.inReview();
    const id = this.item().id;
    this.busy.set(true);
    this.inReview.set(next);

    const request = next ? this.api.addToReview(id) : this.api.removeFromReview(id);
    request.subscribe({
      next: () => this.busy.set(false),
      error: () => {
        this.inReview.set(!next);
        this.busy.set(false);
      }
    });
  }
}