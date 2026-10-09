import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { GrammarCardComponent } from '../../components/grammar/grammar-card.component';
import { WordCardComponent } from '../../components/vocabulary/word-card.component';
import { toApiError } from '../../core/models/api-error.model';
import { LESSON_STEPS, LessonStep } from '../../domain/enums/learning.enums';
import { GrammarTopic } from '../../models/grammar/grammar.models';
import { LessonDetail } from '../../models/learning/learning.models';
import { VocabularyItem } from '../../models/vocabulary/vocabulary.models';
import { GrammarApiService } from '../../services/grammar/grammar-api.service';
import { LearningApiService } from '../../services/learning/learning-api.service';
import { VocabularyApiService } from '../../services/vocabulary/vocabulary-api.service';
import { IconComponent } from '../../shared/components/icon.component';
import { LearningStore } from '../../state/learning/learning.store';

@Component({
  selector: 'dm-lesson-page',
  imports: [RouterLink, IconComponent, WordCardComponent, GrammarCardComponent],
  template: `
    <section class="page">
      <a class="back-link" routerLink="/learn" [queryParams]="backParams()">
        <dm-icon name="arrow-left" /> Learning path
      </a>

      @if (loading()) {
        <p class="muted">Loading lesson...</p>
      } @else if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
        <a class="btn btn-outline" routerLink="/learn">Back to the learning path</a>
      } @else if (lesson(); as l) {
        <p class="eyebrow">{{ l.levelCode }} · Module {{ l.moduleOrder }} · Unit {{ l.unitOrder }} · Lesson {{ l.lessonOrder }}</p>

        <div class="title-row">
          <div>
            <h1 class="hello">{{ l.title }}</h1>
            <p class="sub muted">{{ l.titleEn }} · <span lang="ar" dir="rtl">{{ l.titleAr }}</span></p>
          </div>
          <span class="badge badge-danger time"><dm-icon name="clock" /> {{ l.estimatedMinutes }} min</span>
        </div>

        <div class="steps" role="tablist" aria-label="Lesson steps">
          @for (step of steps; track step) {
            <button type="button" role="tab" class="step" [class.active]="tab() === step" [attr.aria-selected]="tab() === step" (click)="open(step)">
              {{ step }}
              @if (seen().has(step)) {
                <span class="seen-dot" title="Seen"></span>
              }
            </button>
          }
        </div>

        <div class="panel">
          @switch (tab()) {
            @case (LessonStep.Vocabulary) {
              @if (words(); as list) {
                @if (list.length) {
                  <div class="card-grid three">
                    @for (word of list; track word.id) {
                      <dm-word-card [item]="word" />
                    }
                  </div>
                  <a class="btn btn-outline" routerLink="/vocabulary/flashcards" [queryParams]="{ lesson: l.id }">Practice with flashcards</a>
                } @else {
                  <p class="empty">No words in this lesson yet.</p>
                }
              } @else {
                <p class="muted">Loading words...</p>
              }
            }
            @case (LessonStep.Grammar) {
              @if (topics(); as list) {
                @if (list.length) {
                  <div class="card-grid">
                    @for (topic of list; track topic.id) {
                      <dm-grammar-card [topic]="topic" />
                    }
                  </div>
                } @else {
                  <p class="empty">No grammar in this lesson yet.</p>
                }
              } @else {
                <p class="muted">Loading grammar...</p>
              }
            }
            @case (LessonStep.Practice) {
              <div class="card"><h2>Practice</h2><p class="muted">Exercises for this lesson arrive in phase 5. Opening this tab counts the step as seen for now.</p></div>
            }
            @case (LessonStep.Reading) {
              <div class="card"><h2>Reading</h2><p class="muted">Reading texts and questions arrive in phase 6. Opening this tab counts the step as seen for now.</p></div>
            }
            @case (LessonStep.Writing) {
              <div class="card"><h2>Writing</h2><p class="muted">Writing tasks arrive in phase 6. Opening this tab counts the step as seen for now.</p></div>
            }
          }
        </div>

        <footer class="foot">
          <span class="muted">{{ seen().size }} of {{ steps.length }} steps seen</span>
          @if (l.isCompleted) {
            <a class="btn btn-dark" routerLink="/learn" [queryParams]="{ level: l.levelCode }">Back to path</a>
          } @else {
            <button class="btn btn-primary" type="button" [disabled]="!canFinish() || finishing()" (click)="finish()">
              {{ finishing() ? 'Saving...' : 'Finish lesson' }}
            </button>
          }
        </footer>
      }
    </section>
  `,
  styles: [
    `
      .title-row { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 1rem; margin: 0.35rem 0 1.25rem; }
      .title-row .hello { margin: 0 0 0.25rem; }
      .time dm-icon { width: 1rem; height: 1rem; }
      .steps { display: flex; gap: 0.6rem; margin-bottom: 1.25rem; padding-bottom: 0.25rem; overflow-x: auto; }
      .step {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        flex: 0 0 auto;
        min-height: 48px;
        padding: 0 1.1rem;
        font-weight: 600;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        cursor: pointer;
      }
      .step.active { background: var(--ink); border-color: var(--ink); color: var(--bg); }
      .seen-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); }
      .panel { min-height: 160px; margin-bottom: 1.25rem; }
      .panel h2 { margin-bottom: 0.5rem; font-size: 1.6rem; }
      .foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
    `
  ]
})
export class LessonPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly learningApi = inject(LearningApiService);
  private readonly vocabularyApi = inject(VocabularyApiService);
  private readonly grammarApi = inject(GrammarApiService);
  private readonly learningStore = inject(LearningStore);

  protected readonly LessonStep = LessonStep;
  protected readonly steps = LESSON_STEPS;

  protected readonly lesson = signal<LessonDetail | null>(null);
  protected readonly seen = signal<ReadonlySet<LessonStep>>(new Set<LessonStep>());
  protected readonly tab = signal<LessonStep>(LessonStep.Vocabulary);
  protected readonly words = signal<VocabularyItem[] | null>(null);
  protected readonly topics = signal<GrammarTopic[] | null>(null);
  protected readonly loading = signal(true);
  protected readonly finishing = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly canFinish = computed(() => this.steps.every((step) => this.seen().has(step)));
  protected readonly backParams = computed(() => {
    const level = this.lesson()?.levelCode;
    return level ? { level } : {};
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        filter((id): id is string => !!id),
        takeUntilDestroyed()
      )
      .subscribe((id) => this.load(id));
  }

  protected open(step: LessonStep): void {
    const lesson = this.lesson();
    if (!lesson) {
      return;
    }

    this.tab.set(step);

    if (step === LessonStep.Vocabulary && this.words() === null) {
      this.vocabularyApi.forLesson(lesson.id).subscribe({
        next: (items) => this.words.set(items),
        error: () => this.words.set([])
      });
    }

    if (step === LessonStep.Grammar && this.topics() === null) {
      this.grammarApi.forLesson(lesson.id).subscribe({
        next: (items) => this.topics.set(items),
        error: () => this.topics.set([])
      });
    }

    if (!this.seen().has(step)) {
      this.markSeen(lesson.id, step);
    }
  }

  protected finish(): void {
    const lesson = this.lesson();
    if (!lesson || !this.canFinish()) {
      return;
    }

    this.finishing.set(true);
    this.error.set(null);

    this.learningApi.finish(lesson.id).subscribe({
      next: (response) => {
        this.learningStore.refresh().subscribe({ error: () => undefined });
        const target = response.nextLessonId ? ['/learn', 'lesson', response.nextLessonId] : ['/learn'];
        void this.router.navigate(target, {
          queryParams: response.nextLessonId ? {} : { level: lesson.levelCode }
        });
      },
      error: (e: unknown) => {
        this.finishing.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.finishing.set(false);
    this.error.set(null);
    this.lesson.set(null);
    this.words.set(null);
    this.topics.set(null);

    this.learningApi.lesson(id).subscribe({
      next: (lesson) => {
        this.lesson.set(lesson);
        this.seen.set(new Set(lesson.stepsSeen));
        this.loading.set(false);
        const firstUnseen = this.steps.find((step) => !lesson.stepsSeen.includes(step));
        this.open(firstUnseen ?? LessonStep.Vocabulary);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  private markSeen(lessonId: string, step: LessonStep): void {
    this.seen.update((current) => new Set(current).add(step));

    this.learningApi.markStep(lessonId, step).subscribe({
      next: (progress) => this.seen.set(new Set(progress.stepsSeen)),
      error: () =>
        this.seen.update((current) => {
          const next = new Set(current);
          next.delete(step);
          return next;
        })
    });
  }
}