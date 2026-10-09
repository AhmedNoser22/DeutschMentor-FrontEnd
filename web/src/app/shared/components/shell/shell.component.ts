import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthStore } from '../../../state/auth/auth.store';
import { IconComponent } from '../icon.component';
import { LogoComponent } from '../logo.component';
import { NAV_ITEMS } from './nav-items';

@Component({
  selector: 'dm-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent, IconComponent],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <a routerLink="/today" class="brand" aria-label="DeutschMentor home"><dm-logo /></a>

        <nav class="nav" aria-label="Main">
          @for (item of items(); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" class="nav-link">
              <dm-icon [name]="item.icon" />
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-foot">
          @if (store.user(); as user) {
            <a routerLink="/profile" class="me">
              <span class="avatar">{{ store.initials() }}</span>
              <span class="me-text">
                <strong>{{ user.fullName }}</strong>
                <small>Level {{ user.currentLevel }}</small>
              </span>
            </a>
          }
          <div class="foot-actions">
            <button class="btn btn-outline" type="button" (click)="theme.toggle()">
              <dm-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" />
              {{ theme.theme() === 'dark' ? 'Light' : 'Dark' }}
            </button>
            <button class="btn btn-outline" type="button" (click)="store.signOut()">
              <dm-icon name="logout" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <header class="topbar">
        <dm-logo />
        <div class="actions">
          <button class="btn btn-outline btn-icon" type="button" aria-label="Toggle theme" (click)="theme.toggle()">
            <dm-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" />
          </button>
          <button class="btn btn-outline btn-icon" type="button" aria-label="Sign out" (click)="store.signOut()">
            <dm-icon name="logout" />
          </button>
        </div>
      </header>

      <main class="content">
        <router-outlet />
      </main>

      <nav class="bottom-nav" aria-label="Main">
        @for (item of items(); track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active">
            <dm-icon [name]="item.icon" />
            <span>{{ item.shortLabel }}</span>
          </a>
        }
      </nav>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .shell { min-height: 100dvh; }

      .sidebar { display: none; }

      .topbar {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: calc(0.75rem + env(safe-area-inset-top)) 1rem 0.75rem;
        background: var(--surface);
        border-bottom: 1px solid var(--line);
      }
      .topbar .actions { display: flex; gap: 0.5rem; }

      .content { padding-bottom: calc(84px + env(safe-area-inset-bottom)); }

      .bottom-nav {
        position: fixed;
        inset: auto 0 0 0;
        z-index: 10;
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 1fr;
        background: var(--surface);
        border-top: 1px solid var(--line);
        padding-bottom: env(safe-area-inset-bottom);
      }
      .bottom-nav a {
        display: grid;
        justify-items: center;
        gap: 0.15rem;
        padding: 0.55rem 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--muted);
        text-decoration: none;
      }
      .bottom-nav a.active { color: var(--primary); }

      .nav-link {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        min-height: 48px;
        padding: 0 1rem;
        border-radius: var(--radius-sm);
        font-weight: 500;
        color: var(--ink-soft);
        text-decoration: none;
      }
      .nav-link.active { background: var(--ink); color: var(--bg); }

      .me { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
      .avatar {
        display: grid;
        place-items: center;
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 10px;
        background: var(--gold);
        color: #14171c;
        font-family: var(--font-display);
        font-weight: 700;
        font-size: 1.15rem;
      }
      .me-text { display: grid; line-height: 1.2; }
      .me-text small { color: var(--muted); }
      .foot-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
      .foot-actions .btn { flex: 1; min-height: 44px; padding: 0 0.5rem; }

      @media (min-width: 900px) {
        .shell { display: grid; grid-template-columns: 264px 1fr; }
        .sidebar {
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: 100dvh;
          padding: 1.5rem 1rem;
          background: var(--surface);
          border-right: 1px solid var(--line);
        }
        .brand { padding: 0 0.5rem; text-decoration: none; }
        .nav { display: grid; gap: 0.35rem; }
        .sidebar-foot { margin-top: auto; }
        .topbar, .bottom-nav { display: none; }
        .content { padding-bottom: 0; }
      }
    `
  ]
})
export class ShellComponent implements OnInit {
  protected readonly store = inject(AuthStore);
  protected readonly theme = inject(ThemeService);

  protected readonly items = computed(() =>
    NAV_ITEMS.filter((item) => !item.adminOnly || this.store.isAdmin())
  );

  ngOnInit(): void {
    this.store.loadProfile().subscribe({ error: () => undefined });
  }
}