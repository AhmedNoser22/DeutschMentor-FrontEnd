import { Component, input } from '@angular/core';
import { WeekDay } from '../../models/progress/progress.models';

const LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

@Component({
  selector: 'dm-week-strip',
  template: `
    <section class="card week">
      <h2>This week</h2>
      <div class="days">
        @for (day of week(); track day.date; let i = $index) {
          <span
            class="day"
            [class.active]="day.active"
            [class.today]="day.isToday"
            [class.future]="day.isFuture"
            [attr.aria-label]="labels[i] + (day.active ? ', studied' : day.isFuture ? '' : ', not studied')"
          >
            {{ labels[i] }}
          </span>
        }
      </div>
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .week { display: grid; gap: 0.9rem; }
      .week h2 { font-size: 1.7rem; }
      .days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 0.4rem; }
      .day {
        display: grid;
        place-items: center;
        min-height: 46px;
        font-weight: 600;
        color: var(--muted);
        background: var(--surface-2);
        border: 2px solid transparent;
        border-radius: 8px;
      }
      .day.active { color: #14171c; background: var(--gold); }
      .day.today { border-color: var(--ink); }
      .day.future { opacity: 0.6; }
    `
  ]
})
export class WeekStripComponent {
  readonly week = input.required<readonly WeekDay[]>();
  protected readonly labels = LABELS;
}