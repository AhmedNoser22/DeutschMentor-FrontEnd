import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LessonState } from '../../domain/enums/learning.enums';
import { PathModule } from '../../models/learning/learning.models';
import { IconComponent, IconName } from '../../shared/components/icon.component';

@Component({
  selector: 'dm-module-card',
  imports: [RouterLink, IconComponent],
  template: `
    <section class="module">
      <button type="button" class="head" [attr.aria-expanded]="expanded()" (click)="toggled.emit()">
        <span [class]="'num ' + tone()">{{ module().order }}</span>
        <span class="titles">
          <strong>{{ module().title }}</strong>
          <small>{{ module().titleEn }}</small>
        </span>
        <span [class]="'pill ' + tone()">{{ module().completedLessons }}/{{ module().totalLessons }}</span>
        <dm-icon class="chev" [class.open]="expanded()" name="chevron-down" />
      </button>

      @if (expanded()) {
        <div class="body">
          @for (unit of module().units; track unit.id) {
            <p class="eyebrow unit">{{ unit.title }}</p>
            <ul class="lessons">
              @for (lesson of unit.lessons; track lesson.id) {
                <li
                  class="lesson"
                  [class.current]="lesson.state === LessonState.Current"
                  [class.locked]="lesson.state === LessonState.Locked"
                >
                  <span [class]="'dot ' + dotTone(lesson.state)">
                    <dm-icon [name]="iconFor(lesson.state)" />
                  </span>
                  <span class="name">
                    <strong>{{ lesson.title }}</strong>
                    <small>{{ lesson.titleEn }} · {{ lesson.estimatedMinutes }} min</small>
                  </span>
                  @switch (lesson.state) {
                    @case (LessonState.Completed) {
                      <a class="btn btn-outline" [routerLink]="['/learn/lesson', lesson.id]">Review</a>
                    }
                    @case (LessonState.Current) {
                      <a class="btn btn-primary" [routerLink]="['/learn/lesson', lesson.id]">Continue</a>
                    }
                    @case (LessonState.Open) {
                      <a class="btn btn-outline" [routerLink]="['/learn/lesson', lesson.id]">Open</a>
                    }
                  }
                </li>
              }
            </ul>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .module { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); }
      .head {
        display: flex;
        align-items: center;
        gap: 0.9rem;
        width: 100%;
        padding: 1rem 1.1rem;
        text-align: left;
        background: transparent;
        border: 0;
        cursor: pointer;
      }
      .num {
        display: grid;
        place-items: center;
        flex: none;
        width: 44px;
        height: 44px;
        border-radius: 8px;
        font-family: var(--font-display);
        font-size: 1.4rem;
        font-weight: 700;
      }
      .num.done { background: var(--ink); color: var(--bg); }
      .num.active { background: var(--primary); color: var(--primary-ink); }
      .num.idle { background: var(--surface-2); color: var(--muted); }
      .titles { display: grid; flex: 1; line-height: 1.25; min-width: 0; }
      .titles strong { font-size: 1.1rem; }
      .titles small { color: var(--muted); }
      .pill { padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; }
      .pill.done { background: var(--success-soft); color: var(--success); }
      .pill.active { background: var(--primary-soft); color: var(--primary); }
      .pill.idle { background: var(--surface-2); color: var(--muted); }
      .chev { transition: transform 0.15s; }
      .chev.open { transform: rotate(180deg); }
      .body { padding: 0 1.1rem 1.1rem; }
      .unit { margin: 0.75rem 0 0.5rem; }
      .lessons { display: grid; gap: 0.25rem; margin: 0; padding: 0; list-style: none; }
      .lesson { display: flex; align-items: center; gap: 0.85rem; padding: 0.6rem 0.6rem; border-radius: var(--radius-sm); }
      .lesson.current { background: var(--primary-soft); }
      .lesson.locked { color: var(--muted); }
      .dot { display: grid; place-items: center; flex: none; width: 38px; height: 38px; border-radius: 50%; }
      .dot dm-icon { width: 1.15rem; height: 1.15rem; }
      .dot.done { background: var(--success-soft); color: var(--success); }
      .dot.current { background: var(--primary); color: var(--primary-ink); }
      .dot.open { background: var(--surface-2); color: var(--ink); }
      .dot.locked { background: var(--surface-2); color: var(--muted); }
      .name { display: grid; flex: 1; min-width: 0; line-height: 1.25; }
      .name strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .name small { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .lesson .btn { min-height: 40px; padding: 0 1rem; }
    `
  ]
})
export class ModuleCardComponent {
  readonly module = input.required<PathModule>();
  readonly expanded = input(false);
  readonly toggled = output<void>();

  protected readonly LessonState = LessonState;

  protected readonly tone = computed(() => {
    const module = this.module();
    if (module.totalLessons > 0 && module.completedLessons === module.totalLessons) {
      return 'done';
    }
    const active = module.units.some((unit) => unit.lessons.some((l) => l.state === LessonState.Current));
    return active ? 'active' : 'idle';
  });

  protected iconFor(state: LessonState): IconName {
    switch (state) {
      case LessonState.Completed:
        return 'check';
      case LessonState.Locked:
        return 'lock';
      default:
        return 'arrow-right';
    }
  }

  protected dotTone(state: LessonState): string {
    return state.toLowerCase().replace('completed', 'done');
  }
}