import { Component, input, output } from '@angular/core';
import { LevelStatus } from '../../domain/enums/learning.enums';
import { CefrLevel } from '../../domain/enums/user.enums';
import { LevelSummary } from '../../models/learning/learning.models';

@Component({
  selector: 'dm-level-tabs',
  template: `
    <div class="tabs" role="tablist" aria-label="Levels">
      @for (level of levels(); track level.code) {
        <button
          type="button"
          role="tab"
          class="tab"
          [class.selected]="level.code === selected()"
          [attr.aria-selected]="level.code === selected()"
          (click)="picked.emit(level.code)"
        >
          <span [class]="'code ' + tone(level)">{{ level.code }}</span>
          <span class="meta">
            <strong>{{ level.title }}</strong>
            <small>{{ caption(level) }}</small>
          </span>
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .tabs {
        display: flex;
        gap: 0.75rem;
        padding-bottom: 0.7rem;
        margin-bottom: 1rem;
        overflow-x: auto;
        scroll-snap-type: x proximity;
        -webkit-overflow-scrolling: touch;
      }
      .tab {
        flex: 0 0 auto;
        min-width: 200px;
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.85rem 1rem;
        text-align: left;
        background: var(--surface);
        border: 1.5px solid var(--line);
        border-radius: var(--radius-md);
        cursor: pointer;
        scroll-snap-align: start;
      }
      .tab.selected { border-color: var(--ink); box-shadow: 0 4px 0 var(--ink); }
      .code {
        display: grid;
        place-items: center;
        flex: none;
        width: 46px;
        height: 46px;
        border-radius: 8px;
        font-family: var(--font-display);
        font-size: 1.35rem;
        font-weight: 700;
      }
      .code.passed { background: var(--ink); color: var(--bg); }
      .code.progress { background: var(--primary); color: var(--primary-ink); }
      .code.locked { background: var(--surface-2); color: var(--muted); }
      .meta { display: grid; line-height: 1.2; }
      .meta small { color: var(--muted); }
      @media (min-width: 900px) {
        .tabs { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); overflow: visible; }
        .tab { min-width: 0; }
      }
    `
  ]
})
export class LevelTabsComponent {
  readonly levels = input.required<readonly LevelSummary[]>();
  readonly selected = input<CefrLevel | null>(null);
  readonly picked = output<CefrLevel>();

  protected tone(level: LevelSummary): string {
    switch (level.status) {
      case LevelStatus.Passed:
        return 'passed';
      case LevelStatus.InProgress:
        return 'progress';
      default:
        return 'locked';
    }
  }

  protected caption(level: LevelSummary): string {
    switch (level.status) {
      case LevelStatus.Passed:
        return `Passed ${level.passedScorePercent ?? 0}%`;
      case LevelStatus.InProgress:
        return `${level.completedLessons} of ${level.totalLessons} lessons`;
      default:
        return 'Locked';
    }
  }
}