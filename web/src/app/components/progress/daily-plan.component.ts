import { Component, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { PlanItemKind } from '../../domain/enums/progress.enums';
import { DailyPlan, PlanItem } from '../../models/progress/progress.models';
import { IconComponent } from '../../shared/components/icon.component';

interface Target {
  commands: string[];
  params: Params;
}

@Component({
  selector: 'dm-daily-plan',
  imports: [RouterLink, IconComponent],
  template: `
    <section class="card plan">
      <div class="head">
        <h2>Today's plan</h2>
        <span class="badge">{{ plan().doneCount }} of {{ plan().items.length }} done</span>
      </div>

      @if (plan().items.length) {
        <ul class="items">
          @for (item of plan().items; track item.kind) {
            <li class="item" [class.done]="item.done">
              <span class="box" [class.on]="item.done" aria-hidden="true">
                @if (item.done) {
                  <dm-icon name="check" />
                }
              </span>
              <span class="title">{{ item.title }}</span>
              @if (item.minutes > 0) {
                <span class="min">{{ item.minutes }} min</span>
              }
              @if (!item.done) {
                <a class="open" [routerLink]="target(item).commands" [queryParams]="target(item).params">Open</a>
              }
            </li>
          }
        </ul>

        <p class="muted foot">
          @if (plan().minutesLeft > 0) {
            About {{ plan().minutesLeft }} minutes left today.
          } @else {
            You finished today's plan. Well done.
          }
        </p>
      } @else {
        <p class="muted">Nothing planned yet. Open your learning path to begin.</p>
      }
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .plan { display: grid; gap: 0.75rem; }
      .head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
      .head h2 { font-size: 1.7rem; }
      .items { display: grid; margin: 0; padding: 0; list-style: none; }
      .item { display: flex; align-items: center; gap: 0.8rem; padding: 0.85rem 0; border-top: 1px solid var(--line); }
      .box {
        display: grid;
        place-items: center;
        flex: none;
        width: 28px;
        height: 28px;
        background: var(--surface);
        border: 2px solid var(--line-strong);
        border-radius: 6px;
      }
      .box.on { color: var(--primary-ink); background: var(--primary); border-color: var(--primary); }
      .box dm-icon { width: 1rem; height: 1rem; }
      .title { flex: 1; min-width: 0; }
      .item.done .title { color: var(--muted); text-decoration: line-through; }
      .min { color: var(--muted); font-size: 0.9rem; }
      .open { min-width: 3rem; font-weight: 600; text-align: right; color: var(--primary); text-decoration: none; }
      .open:hover { text-decoration: underline; }
      .foot { padding-top: 0.25rem; }
    `
  ]
})
export class DailyPlanComponent {
  readonly plan = input.required<DailyPlan>();

  protected target(item: PlanItem): Target {
    switch (item.kind) {
      case PlanItemKind.WarmUp:
        return { commands: ['/vocabulary/flashcards'], params: item.lessonId ? { lesson: item.lessonId } : {} };
      case PlanItemKind.Review:
        return { commands: ['/review'], params: {} };
      case PlanItemKind.Lesson:
        return { commands: item.lessonId ? ['/learn/lesson', item.lessonId] : ['/learn'], params: {} };
      case PlanItemKind.Drill:
        return { commands: ['/drills/articles'], params: {} };
    }
  }
}