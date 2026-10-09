import { Component, input } from '@angular/core';
import { GrammarTopic } from '../../models/grammar/grammar.models';

@Component({
  selector: 'dm-grammar-card',
  template: `
    <article class="gcard">
      <h3>{{ topic().title }}</h3>
      <p class="muted">{{ topic().summary }}</p>

      @if (topic().content.table; as table) {
        <div class="table-wrap">
          <table>
            @if (table.headers.length) {
              <thead>
                <tr>
                  @for (header of table.headers; track $index) {
                    <th>{{ header }}</th>
                  }
                </tr>
              </thead>
            }
            <tbody>
              @for (row of table.rows; track $index) {
                <tr>
                  @for (cell of row; track $index) {
                    <td [class.hl]="table.highlightColumns.includes($index)">{{ cell }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (topic().content.noteEn) {
        <p class="note">{{ topic().content.noteEn }}</p>
      }
      @if (topic().content.noteAr) {
        <p class="note ar" lang="ar" dir="rtl">{{ topic().content.noteAr }}</p>
      }
    </article>
  `,
  styles: [
    `
      :host { display: block; }
      .gcard { display: grid; gap: 0.5rem; height: 100%; padding: 1.25rem; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); align-content: start; }
      h3 { font-size: 1.9rem; }
      .table-wrap { margin: 0.75rem 0 0.25rem; overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th { padding: 0.7rem 0.9rem; text-align: left; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); background: var(--surface-2); }
      td { padding: 0.75rem 0.9rem; border-bottom: 1px solid var(--line); }
      td.hl { font-weight: 600; color: var(--primary); }
      .note { padding: 0.9rem 1rem; margin-top: 0.5rem; background: var(--surface-2); border-radius: var(--radius-sm); }
      .ar { direction: rtl; text-align: right; }
    `
  ]
})
export class GrammarCardComponent {
  readonly topic = input.required<GrammarTopic>();
}