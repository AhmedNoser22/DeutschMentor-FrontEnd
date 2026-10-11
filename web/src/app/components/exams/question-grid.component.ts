import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'dm-question-grid',
  template: `
    <div class="grid" role="list">
      @for (n of numbers(); track n) {
        <button
          type="button"
          role="listitem"
          class="cell"
          [class.answered]="answered().has(n - 1)"
          [class.flagged]="flagged().has(n - 1)"
          [class.current]="current() === n - 1"
          [attr.aria-label]="'Question ' + n"
          [attr.aria-current]="current() === n - 1 ? 'true' : null"
          (click)="picked.emit(n - 1)"
        >
          {{ n }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .grid { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 0.4rem; }
      .cell {
        min-height: 38px;
        padding: 0;
        font-size: 0.85rem;
        font-weight: 600;
        background: var(--surface);
        border: 1.5px solid var(--line);
        border-radius: 6px;
        cursor: pointer;
      }
      .cell.answered { background: var(--ink); border-color: var(--ink); color: var(--bg); }
      .cell.flagged { border-bottom: 4px solid var(--gold); }
      .cell.current { outline: 2.5px solid var(--primary); outline-offset: 1px; }
    `
  ]
})
export class QuestionGridComponent {
  readonly total = input.required<number>();
  readonly current = input(0);
  readonly answered = input<ReadonlySet<number>>(new Set<number>());
  readonly flagged = input<ReadonlySet<number>>(new Set<number>());
  readonly picked = output<number>();

  protected readonly numbers = computed(() => Array.from({ length: this.total() }, (_, i) => i + 1));
}