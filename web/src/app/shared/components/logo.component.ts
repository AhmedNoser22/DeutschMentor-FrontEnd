import { Component, input } from '@angular/core';

@Component({
  selector: 'dm-logo',
  template: `
    <span class="logo" [class.inverse]="inverse()">
      <svg viewBox="0 0 40 36" width="36" height="32" aria-hidden="true">
        <rect class="top" x="0" y="0" width="18" height="10" />
        <rect x="0" y="13" width="28" height="10" fill="#c8231c" />
        <rect x="0" y="26" width="40" height="10" fill="#e8b000" />
      </svg>
      <span class="word">DeutschMentor</span>
    </span>
  `,
  styles: [
    `
      :host { display: inline-flex; }
      .logo { display: inline-flex; align-items: center; gap: 0.6rem; color: var(--ink); }
      .logo.inverse { color: #ffffff; }
      .top { fill: currentColor; }
      .word { font-family: var(--font-display); font-weight: 700; font-size: 1.6rem; letter-spacing: -0.01em; }
    `
  ]
})
export class LogoComponent {
  readonly inverse = input(false);
}