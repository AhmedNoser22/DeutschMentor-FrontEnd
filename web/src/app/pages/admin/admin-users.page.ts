import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toApiError } from '../../core/models/api-error.model';
import { AdminUser } from '../../models/admin/admin-user.models';
import { AdminUsersApiService } from '../../services/admin/admin-users-api.service';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthStore } from '../../state/auth/auth.store';

@Component({
  selector: 'dm-admin-users-page',
  imports: [DatePipe, RouterLink, IconComponent],
  template: `
    <section class="page">
      <a class="back-link" routerLink="/admin"><dm-icon name="arrow-left" /> Admin</a>
      <p class="eyebrow">Admin</p>
      <h1 class="hello">Users</h1>

      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }

      <div class="filters-row">
        <input class="input" type="search" placeholder="Search name or email" (input)="onSearch($event)" aria-label="Search users" />
        <select class="input" (change)="setRole($event)" aria-label="Role">
          <option value="">All roles</option>
          <option value="Student">Students</option>
          <option value="Admin">Admins</option>
        </select>
        <select class="input" (change)="setStatus($event)" aria-label="Status">
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Locked">Locked</option>
        </select>
      </div>

      <p class="muted count">{{ total() }} {{ total() === 1 ? 'user' : 'users' }}</p>

      <div class="card table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>User</th><th>Role</th><th>Level</th><th>Sign-in</th><th>Progress</th><th>Last login</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr [class.locked]="!u.isActive">
                  <td><strong>{{ u.fullName }}</strong><br /><span class="muted">{{ u.email }}</span></td>
                  <td>{{ u.role }}</td>
                  <td>{{ u.currentLevel }}</td>
                  <td>{{ u.signIn }}</td>
                  <td class="muted">{{ u.lessonsCompleted }} lessons · {{ u.certificates }} certificates</td>
                  <td>{{ u.lastLoginAtUtc ? (u.lastLoginAtUtc | date: 'd MMM y, HH:mm') : 'Never' }}</td>
                  <td><span [class]="'badge ' + (u.isActive ? 'badge-success' : 'badge-danger')">{{ u.isActive ? 'Active' : 'Locked' }}</span></td>
                  <td class="actions">
                    @if (u.role === 'Admin' || u.id === me()?.id) {
                      <span class="muted">—</span>
                    } @else if (!u.isActive) {
                      <button class="btn btn-outline" type="button" [disabled]="busy()" (click)="setLocked(u, false)">Unlock</button>
                    } @else if (confirmId() === u.id) {
                      <button class="btn btn-primary" type="button" [disabled]="busy()" (click)="setLocked(u, true)">Yes, lock</button>
                      <button class="btn btn-outline" type="button" (click)="confirmId.set(null)">Cancel</button>
                    } @else {
                      <button class="btn btn-outline" type="button" [disabled]="busy()" (click)="confirmId.set(u.id)">Lock</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="muted">No users found.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="row">
        <button class="btn btn-outline" type="button" [disabled]="page() <= 1" (click)="go(page() - 1)">Previous</button>
        <span class="muted">Page {{ page() }} of {{ pages() }}</span>
        <button class="btn btn-outline" type="button" [disabled]="page() >= pages()" (click)="go(page() + 1)">Next</button>
      </div>
    </section>
  `,
  styles: [
    `
      .filters-row { display: grid; gap: 0.6rem; grid-template-columns: 1fr; margin-bottom: 0.75rem; }
      .count { margin-bottom: 0.75rem; }
      .table-card { padding: 0.5rem 1rem; margin-bottom: 1rem; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th { padding: 0.6rem; font-size: 0.75rem; text-align: left; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); background: var(--surface-2); white-space: nowrap; }
      td { padding: 0.7rem 0.6rem; border-bottom: 1px solid var(--line); vertical-align: middle; }
      tr.locked td { opacity: 0.75; }
      .actions { display: flex; gap: 0.4rem; white-space: nowrap; }
      .actions .btn { min-height: 38px; padding: 0 0.8rem; }
      .row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; }
      @media (min-width: 900px) {
        .filters-row { grid-template-columns: 2fr 1fr 1fr; }
      }
    `
  ]
})
export class AdminUsersPage {
  private readonly api = inject(AdminUsersApiService);
  protected readonly me = inject(AuthStore).user;

  protected readonly users = signal<AdminUser[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly search = signal('');
  protected readonly role = signal('');
  protected readonly status = signal('');
  protected readonly busy = signal(false);
  protected readonly confirmId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / 20)));

  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.load();
  }

  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.search.set(value);
      this.go(1);
    }, 300);
  }

  protected setRole(event: Event): void {
    this.role.set((event.target as HTMLSelectElement).value);
    this.go(1);
  }

  protected setStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value);
    this.go(1);
  }

  protected go(page: number): void {
    this.page.set(page);
    this.load();
  }

  protected setLocked(user: AdminUser, locked: boolean): void {
    this.busy.set(true);
    this.error.set(null);

    this.api.setLocked(user.id, locked).subscribe({
      next: () => {
        this.busy.set(false);
        this.confirmId.set(null);
        this.load();
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  private load(): void {
    this.api
      .list({ search: this.search(), role: this.role(), status: this.status(), page: this.page() })
      .subscribe({
        next: (result) => {
          this.users.set(result.items);
          this.total.set(result.total);
        },
        error: (e: unknown) => this.error.set(toApiError(e).message)
      });
  }
}