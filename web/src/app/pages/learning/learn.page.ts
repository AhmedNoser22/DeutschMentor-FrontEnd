import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExamCardComponent } from '../../components/learning/exam-card.component';
import { LevelTabsComponent } from '../../components/learning/level-tabs.component';
import { LockedLevelComponent } from '../../components/learning/locked-level.component';
import { ModuleCardComponent } from '../../components/learning/module-card.component';
import { toApiError } from '../../core/models/api-error.model';
import { LessonState, LevelStatus } from '../../domain/enums/learning.enums';
import { CefrLevel } from '../../domain/enums/user.enums';
import { LevelDetail, LevelSummary } from '../../models/learning/learning.models';
import { LearningApiService } from '../../services/learning/learning-api.service';
import { LearningStore } from '../../state/learning/learning.store';

@Component({
  selector: 'dm-learn-page',
  imports: [RouterLink, LevelTabsComponent, ModuleCardComponent, ExamCardComponent, LockedLevelComponent],
  template: `
    <section class="page">
      <div class="page-head">
        <div>
          <p class="eyebrow">Learning path</p>
          <h1 class="hello">From A1 to C1</h1>
        </div>
        <p class="muted head-note">A level opens only after you pass the exam of the level before it.</p>
      </div>

      @if (store.error(); as message) {
        <div class="alert alert-error" role="alert">{{ message }}</div>
        <button class="btn btn-outline" type="button" (click)="loadPath()">Try again</button>
      }

      @if (store.loaded()) {
        <dm-level-tabs [levels]="store.levels()" [selected]="selectedCode()" (picked)="select($event)" />

        <div class="links">
          <a class="btn btn-outline" routerLink="/vocabulary">Vocabulary library</a>
          <a class="btn btn-outline" routerLink="/grammar">Grammar library</a>
        </div>

        @if (detailLoading()) {
          <p class="muted">Loading level...</p>
        } @else if (detailError()) {
          <div class="alert alert-error" role="alert">{{ detailError() }}</div>
        } @else if (detail(); as d) {
          @if (d.summary.status === LevelStatus.Locked) {
            <dm-locked-level [detail]="d" />
          } @else {
            @if (!d.modules.length) {
              <p class="empty">Lessons for this level are coming soon.</p>
            }
            <div class="modules">
              @for (module of d.modules; track module.id) {
                <dm-module-card [module]="module" [expanded]="expanded().has(module.id)" (toggled)="toggle(module.id)" />
              }
            </div>
            <dm-exam-card
              [exam]="d.exam"
              [levelCode]="d.summary.code"
              [completed]="d.summary.completedLessons"
              [total]="d.summary.totalLessons"
              [score]="d.summary.passedScorePercent"
            />
          }
        }
      } @else if (!store.error()) {
        <p class="muted">Loading your path...</p>
      }
    </section>
  `,
  styles: [
    `
      .head-note { max-width: 24rem; }
      .links { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.25rem; }
      .modules { display: grid; gap: 1rem; margin-bottom: 1rem; }
    `
  ]
})
export class LearnPage {
  protected readonly store = inject(LearningStore);
  private readonly api = inject(LearningApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly LevelStatus = LevelStatus;
  protected readonly selectedCode = signal<CefrLevel | null>(null);
  protected readonly detail = signal<LevelDetail | null>(null);
  protected readonly detailLoading = signal(false);
  protected readonly detailError = signal<string | null>(null);
  protected readonly expanded = signal<ReadonlySet<string>>(new Set<string>());

  constructor() {
    this.loadPath();
  }

  protected loadPath(): void {
    this.store.refresh().subscribe({
      next: (levels) => this.pickInitial(levels),
      error: () => undefined
    });
  }

  protected select(code: CefrLevel, syncUrl = true): void {
    this.selectedCode.set(code);
    this.detail.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);

    if (syncUrl) {
      void this.router.navigate([], { relativeTo: this.route, queryParams: { level: code }, replaceUrl: true });
    }

    this.api.level(code).subscribe({
      next: (detail) => {
        if (this.selectedCode() !== code) {
          return;
        }
        this.detail.set(detail);
        this.expandCurrent(detail);
        this.detailLoading.set(false);
      },
      error: (e: unknown) => {
        if (this.selectedCode() !== code) {
          return;
        }
        this.detailLoading.set(false);
        this.detailError.set(toApiError(e).message);
      }
    });
  }

  protected toggle(id: string): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
  }

  private pickInitial(levels: readonly LevelSummary[]): void {
    const requested = this.route.snapshot.queryParamMap.get('level');
    const valid = levels.find((level) => level.code === requested);
    const code = valid?.code ?? this.store.activeLevel()?.code ?? levels[0]?.code;
    if (code) {
      this.select(code, false);
    }
  }

  private expandCurrent(detail: LevelDetail): void {
    const target =
      detail.modules.find((m) => m.units.some((u) => u.lessons.some((l) => l.state === LessonState.Current))) ??
      detail.modules.find((m) => m.completedLessons < m.totalLessons) ??
      detail.modules[0];

    this.expanded.set(new Set(target ? [target.id] : []));
  }
}