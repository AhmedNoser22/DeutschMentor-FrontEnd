import { Component, input } from '@angular/core';
import { ScoreBreakdown } from '../../models/exams/exam.models';

@Component({
  selector: 'dm-score-bars',
  template: `
    <div class="bars">
      @for (item of items(); track item.label) {
        <div class="row">
          <span class="label">{{ item.label }}</span>
          <div class="track" role="img" [attr.aria-label]="item.label + ' ' + item.percent + ' percent'">
            <span class="fill" [class.low]="item.percent < passMark()" [style.width.%]="item.percent"></span>
            <span class="mark" [style.left.%]="passMark()"></span>
          </div>
          <span class="pct">{{ item.percent }}%</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .bars { display: grid; gap: 0.9rem; }
      .row { display: grid; grid-template-columns: 6.5rem 1fr 3rem; align-items: center; gap: 0.75rem; }
      .label { font-weight: 500; }
      .track { position: relative; height: 10px; background: var(--surface-2); border-radius: 999px; }
      .fill { position: absolute; inset: 0 auto 0 0; background: var(--ink); border-radius: inherit; }
      .fill.low { background: var(--primary); }
      .mark { position: absolute; top: -6px; bottom: -6px; width: 2px; background: var(--ink); }
      .pct { text-align: right; font-weight: 600; }
    `
  ]
})
export class ScoreBarsComponent {
  readonly items = input.required<readonly ScoreBreakdown[]>();
  readonly passMark = input(70);
}