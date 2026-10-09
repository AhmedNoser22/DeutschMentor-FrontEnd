import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { GrammarCardComponent } from '../../components/grammar/grammar-card.component';
import { toApiError } from '../../core/models/api-error.model';
import { GrammarTopic } from '../../models/grammar/grammar.models';
import { GrammarApiService } from '../../services/grammar/grammar-api.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'dm-grammar-topic-page',
  imports: [RouterLink, IconComponent, GrammarCardComponent],
  template: `
    <section class="page narrow">
      <a class="back-link" routerLink="/grammar"><dm-icon name="arrow-left" /> Grammar</a>

      @if (loading()) {
        <p class="muted">Loading topic...</p>
      } @else if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      } @else if (topic(); as t) {
        <p class="eyebrow">Grammar · {{ t.level }}</p>
        <div class="gap"></div>
        <dm-grammar-card [topic]="t" />
        <div class="gap"></div>
        <a class="btn btn-outline" [routerLink]="['/learn/lesson', t.lessonId]">Open the lesson</a>
      }
    </section>
  `,
  styles: [`.gap { height: 1rem; }`]
})
export class GrammarTopicPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(GrammarApiService);

  protected readonly topic = signal<GrammarTopic | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        filter((id): id is string => !!id),
        takeUntilDestroyed()
      )
      .subscribe((id) => {
        this.loading.set(true);
        this.error.set(null);
        this.api.get(id).subscribe({
          next: (topic) => {
            this.topic.set(topic);
            this.loading.set(false);
          },
          error: (e: unknown) => {
            this.loading.set(false);
            this.error.set(toApiError(e).message);
          }
        });
      });
  }
}