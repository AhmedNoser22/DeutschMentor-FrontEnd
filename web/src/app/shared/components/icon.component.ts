import { Component, computed, input } from '@angular/core';

export type IconName =
  | 'home'
  | 'learn'
  | 'review'
  | 'exams'
  | 'award'
  | 'admin'
  | 'moon'
  | 'sun'
  | 'logout'
  | 'check'
  | 'arrow-right'
  | 'arrow-left'
  | 'lock'
  | 'clock'
  | 'chevron-down'
  | 'search';

const ICONS: Record<IconName, string[]> = {
  home: ['M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
  learn: ['M3 21h6v-5h5v-5h5V6h2'],
  review: ['M8 8h12v12H8z', 'M4 16V4h12'],
  exams: ['M6 3h9l4 4v14H6z', 'M9 14l2 2 4-4'],
  award: ['M7 9a5 5 0 1 0 10 0a5 5 0 1 0-10 0', 'M9 13.5 8 21l4-2 4 2-1-7.5'],
  admin: ['M4 7h10', 'M18 7h2', 'M4 17h2', 'M10 17h10', 'M14 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0', 'M6 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0'],
  moon: ['M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z'],
  sun: ['M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0', 'M12 2v2', 'M12 20v2', 'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4', 'M2 12h2', 'M20 12h2', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4'],
  logout: ['M10 4H5v16h5', 'M15 8l4 4-4 4', 'M9 12h10'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  'arrow-right': ['M5 12h14', 'M13 6l6 6-6 6'],
  'arrow-left': ['M19 12H5', 'M11 6l-6 6 6 6'],
  lock: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
  clock: ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0', 'M12 7v5l3 2'],
  'chevron-down': ['M6 9l6 6 6-6'],
  search: ['M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0', 'M20 20l-4-4']
};

@Component({
  selector: 'dm-icon',
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @for (d of paths(); track d) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: [
    `
      :host { display: inline-flex; width: 1.5rem; height: 1.5rem; }
      svg { width: 100%; height: 100%; }
    `
  ]
})
export class IconComponent {
  readonly name = input.required<IconName>();
  protected readonly paths = computed(() => ICONS[this.name()]);
}