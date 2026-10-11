import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Achievement } from '../../models/progress/progress.models';
import { IconComponent, IconName } from '../../shared/components/icon.component';

const ICONS: Readonly<Record<string, IconName>> = {
  award: 'award',
  book: 'book',
  flame: 'flame',
  review: 'review'
};

@Component({
  selector: 'dm-achievement-list',
  imports: [DatePipe, IconComponent],
  template: `
    @if (items().length) {
      <ul class="list">
        @for (item of items(); track item.code) {
          <li class="row">
            <span [class]="'ico ' + item.icon" aria-hidden="true"><dm-icon [name]="iconFor(item.icon)" /></span>
            <span class="info">
              <strong>{{ item.title }}</strong>
              <small>{{ item.detail ?? (item.unlockedAtUtc | date: 'd MMM y' : 'UTC') }}</small>
            </span>
          </li>
        }
      </ul>
    } @else {
      <p class="muted">Finish a lesson or review a card to unlock your first achievement.</p>
    }
  `,
  styles: [
    `
      :host { display: block; }
      .list { display: grid; margin: 0; padding: 0; list-style: none; }
      .row { display: flex; align-items: center; gap: 0.85rem; padding: 0.75rem 0; border-top: 1px solid var(--line); }
      .row:first-child { border-top: 0; }
      .ico { display: grid; place-items: center; flex: none; width: 48px; height: 48px; border-radius: 10px; }
      .ico dm-icon { width: 1.5rem; height: 1.5rem; }
      .ico.award { color: #14171c; background: var(--gold); }
      .ico.book { color: var(--art-der-ink); background: var(--art-der-bg); }
      .ico.flame { color: var(--primary); background: var(--primary-soft); }
      .ico.review { color: var(--success); background: var(--success-soft); }
      .info { display: grid; line-height: 1.3; min-width: 0; }
      .info strong { font-size: 1.1rem; }
      .info small { color: var(--muted); }
    `
  ]
})
export class AchievementListComponent {
  readonly items = input.required<readonly Achievement[]>();

  protected iconFor(name: string): IconName {
    return ICONS[name] ?? 'award';
  }
}