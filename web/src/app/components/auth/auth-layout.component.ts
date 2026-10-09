import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LogoComponent } from '../../shared/components/logo.component';

@Component({
  selector: 'dm-auth-layout',
  imports: [RouterLink, RouterLinkActive, LogoComponent],
  template: `
    <div class="auth">
      <aside class="hero">
        <dm-logo [inverse]="true" />
        <div class="copy">
          <h1>Deutsch,<br />Stufe für Stufe.</h1>
          <p>
            German from A1 to C1 for Arabic speakers, taught in English. Pass each level exam to
            unlock the next one and earn a certificate for every level.
          </p>
        </div>
        <div class="steps" aria-hidden="true">
          <span class="s1">A1</span>
          <span class="s2">A2</span>
          <span class="s3">B1</span>
          <span class="s4">B2</span>
          <span class="s5">C1</span>
        </div>
      </aside>

      <main class="main">
        <div class="panel">
          @if (showTabs()) {
            <nav class="tabs" aria-label="Account">
              <a routerLink="/auth/sign-in" routerLinkActive="active">Sign in</a>
              <a routerLink="/auth/create-account" routerLinkActive="active">Create account</a>
            </nav>
          }
          <ng-content />
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .auth { display: grid; grid-template-columns: 1fr; min-height: 100dvh; }

      .hero {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: max(1.25rem, env(safe-area-inset-top)) 1.25rem 1.5rem;
        background: #14171c;
        color: #ffffff;
      }
      .hero h1 { font-size: 2.6rem; }
      .hero p { display: none; color: #aeb4bd; }
      .steps { display: none; }

      .main { display: grid; justify-items: center; align-items: start; padding: 1.5rem 1.25rem 2.5rem; }
      .panel { width: 100%; max-width: 440px; }

      .tabs {
        display: inline-flex;
        margin-bottom: 1.75rem;
        border: 1.5px solid var(--line-strong);
        border-radius: var(--radius-sm);
        overflow: hidden;
      }
      .tabs a { padding: 0.8rem 1.1rem; font-weight: 600; text-decoration: none; }
      .tabs a.active { background: var(--ink); color: var(--bg); }

      @media (min-width: 900px) {
        .auth { grid-template-columns: 1fr 1fr; }
        .hero { justify-content: space-between; gap: 2rem; padding: 3.5rem 4rem 0; }
        .hero h1 { font-size: clamp(3.5rem, 6vw, 5.5rem); }
        .hero p { display: block; max-width: 34rem; font-size: 1.15rem; }
        .steps { display: flex; align-items: flex-end; gap: 0; }
        .steps span {
          flex: 1;
          max-width: 130px;
          padding: 0.75rem;
          font-family: var(--font-display);
          font-size: 1.7rem;
          font-weight: 700;
          color: #14171c;
        }
        .s1 { height: 72px; background: #e8b000; }
        .s2 { height: 100px; background: #e8b000; }
        .s3 { height: 128px; background: #c8231c; color: #ffffff !important; }
        .s4 { height: 156px; background: #c8231c; color: #ffffff !important; }
        .s5 { height: 188px; background: #eef0f4; }
        .main { align-items: center; padding: 3rem; }
      }
    `
  ]
})
export class AuthLayoutComponent {
  readonly showTabs = input(true);
}