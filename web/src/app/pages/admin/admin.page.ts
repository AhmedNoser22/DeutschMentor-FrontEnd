import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toApiError } from '../../core/models/api-error.model';
import { AdminLesson, AdminStats, AdminWriting, ExamPoolRow, ImportReport } from '../../models/admin/admin.models';
import { AdminApiService } from '../../services/admin/admin-api.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'dm-admin-page',
  imports: [DatePipe,RouterLink ],
  template: `
    <section class="page">
      <p class="eyebrow">Admin</p>
      <h1 class="hello">Content</h1>
      <p><a class="btn btn-dark" routerLink="/admin/users">Manage users</a></p>

      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }

      @if (stats(); as s) {
        <div class="stats">
          <div><strong>{{ s.learners }}</strong><span>learners</span></div>
          <div><strong>{{ s.lessons }}</strong><span>lessons</span></div>
          <div><strong>{{ s.drafts }}</strong><span>drafts</span></div>
          <div><strong>{{ s.examsTaken }}</strong><span>exams taken</span></div>
        </div>
      }

      <article class="card block">
        <h2>Import content</h2>
        <p class="muted">Choose a content pack (JSON). Check it first. Nothing is saved if the file has errors.</p>
        <input type="file" accept=".json,application/json" (change)="onFile($event)" />
        @if (fileName()) {
          <p class="muted">{{ fileName() }}</p>
        }
        <div class="row">
          <button class="btn btn-outline" type="button" [disabled]="!pack() || busy()" (click)="check()">Check file</button>
          <button class="btn btn-dark" type="button" [disabled]="!canImport() || busy()" (click)="runImport(false)">Import as draft</button>
          <button class="btn btn-primary" type="button" [disabled]="!canImport() || busy()" (click)="runImport(true)">Import and publish</button>
        </div>

        @if (report(); as r) {
          <div class="report">
            @if (r.imported) {
              <div class="alert alert-success">Imported successfully.</div>
            } @else if (r.errors.length === 0) {
              <div class="alert alert-success">The file is valid.</div>
            } @else {
              <div class="alert alert-error">{{ r.errors.length }} errors. Nothing was saved.</div>
            }
            <p class="muted">{{ countsText(r) }}</p>
            @if (r.errors.length) {
              <ul class="list err">@for (e of r.errors; track $index) { <li>{{ e }}</li> }</ul>
            }
            @if (r.warnings.length) {
              <p class="eyebrow">Warnings</p>
              <ul class="list">@for (w of r.warnings; track $index) { <li>{{ w }}</li> }</ul>
            }
          </div>
        }
      </article>

      <article class="card block">
        <h2>Lessons</h2>
        <div class="filters-row">
          <input class="input" type="search" placeholder="Search lessons" [value]="search()" (input)="onSearch($event)" aria-label="Search lessons" />
          <select class="input" [value]="level()" (change)="setLevel($event)" aria-label="Level">
            <option value="">All levels</option>
            @for (l of levels; track l) { <option [value]="l">{{ l }}</option> }
          </select>
          <select class="input" [value]="status()" (change)="setStatus($event)" aria-label="Status">
            <option value="">All statuses</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Lesson</th><th>Level</th><th>Status</th><th>Content</th><th>Created</th><th></th></tr></thead>
            <tbody>
              @for (row of lessons(); track row.id) {
                <tr>
                  <td>{{ row.code }}</td>
                  <td>{{ row.title }}</td>
                  <td>{{ row.level }}</td>
                  <td><span [class]="'badge ' + (row.status === 'Published' ? 'badge-success' : 'badge-gold')">{{ row.status }}</span></td>
                  <td class="muted">{{ row.words }}w · {{ row.grammar }}g · {{ row.exercises }}e · {{ row.reading }}r · {{ row.writing }}wr</td>
                  <td>{{ row.createdAtUtc | date: 'd MMM' : 'UTC' }}</td>
                  <td class="actions">
                    <button class="btn btn-outline" type="button" [disabled]="busy()" (click)="toggle(row)">{{ row.status === 'Published' ? 'Unpublish' : 'Publish' }}</button>
                    @if (row.status === 'Draft') {
                      <button class="btn btn-outline" type="button" [disabled]="busy()" (click)="remove(row)">Delete</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="muted">No lessons found.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <div class="row">
          <button class="btn btn-outline" type="button" [disabled]="page() <= 1" (click)="go(page() - 1)">Previous</button>
          <span class="muted">Page {{ page() }} of {{ pages() }} · {{ total() }} lessons</span>
          <button class="btn btn-outline" type="button" [disabled]="page() >= pages()" (click)="go(page() + 1)">Next</button>
        </div>
      </article>

      <article class="card block">
        <h2>Writing reviews</h2>
        @for (item of writing(); track item.id) {
          <div class="review">
            <p><strong>{{ item.studentName }}</strong> · {{ item.taskTitle }} · automatic score {{ item.scorePercent }}%</p>
            <p class="muted">{{ item.prompt }}</p>
            <blockquote lang="de">{{ item.text }}</blockquote>
            <p class="muted">Model answer: {{ item.sampleAnswer }}</p>
            <div class="row">
              <input class="input small" type="number" min="0" max="100" placeholder="Score %" [value]="draftScore(item.id)" (input)="setDraft(item.id, 'score', $event)" aria-label="Score" />
              <input class="input grow" type="text" maxlength="1000" placeholder="Feedback for the student" [value]="draftFeedback(item.id)" (input)="setDraft(item.id, 'feedback', $event)" aria-label="Feedback" />
              <button class="btn btn-primary" type="button" [disabled]="busy() || !draftFeedback(item.id).trim()" (click)="sendReview(item)">Send</button>
            </div>
          </div>
        } @empty {
          <p class="muted">No writing is waiting for review.</p>
        }
      </article>

      <article class="card block">
        <h2>Exam question pool</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Level</th><th>Skill</th><th>Active questions</th></tr></thead>
            <tbody>
              @for (row of pool(); track row.level + row.skill) {
                <tr><td>{{ row.level }}</td><td>{{ row.skill }}</td><td>{{ row.count }}</td></tr>
              } @empty {
                <tr><td colspan="3" class="muted">No exam questions yet.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </article>
    </section>
  `,
  styles: [
    `
      .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem; }
      .stats div { display: grid; }
      .stats strong { font-family: var(--font-display); font-size: 2.6rem; line-height: 1; }
      .stats span { color: var(--muted); }
      .block { display: grid; gap: 0.9rem; margin-bottom: 1rem; }
      .block h2 { font-size: 1.7rem; }
      .row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; }
      .filters-row { display: grid; gap: 0.6rem; grid-template-columns: 1fr; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th { padding: 0.6rem; font-size: 0.75rem; text-align: left; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); background: var(--surface-2); }
      td { padding: 0.6rem; border-bottom: 1px solid var(--line); vertical-align: middle; }
      .actions { display: flex; gap: 0.4rem; }
      .actions .btn { min-height: 38px; padding: 0 0.8rem; }
      .list { margin: 0; padding-left: 1.2rem; }
      .list.err { color: var(--danger); }
      .report { display: grid; gap: 0.5rem; }
      .review { display: grid; gap: 0.5rem; padding-top: 0.9rem; border-top: 1px solid var(--line); }
      blockquote { margin: 0; padding: 0.7rem 0.9rem; background: var(--surface-2); border-left: 4px solid var(--ink); border-radius: var(--radius-sm); white-space: pre-wrap; }
      .small { width: 8rem; }
      .grow { flex: 1 1 14rem; }
      @media (min-width: 900px) {
        .stats { grid-template-columns: repeat(4, 1fr); }
        .filters-row { grid-template-columns: 2fr 1fr 1fr; }
      }
    `
  ]
})
export class AdminPage {
  private readonly api = inject(AdminApiService);

  protected readonly levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
  protected readonly stats = signal<AdminStats | null>(null);
  protected readonly lessons = signal<AdminLesson[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly search = signal('');
  protected readonly level = signal('');
  protected readonly status = signal('');
  protected readonly writing = signal<AdminWriting[]>([]);
  protected readonly pool = signal<ExamPoolRow[]>([]);
  protected readonly pack = signal<unknown>(null);
  protected readonly fileName = signal('');
  protected readonly report = signal<ImportReport | null>(null);
  protected readonly checked = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly drafts = signal<Readonly<Record<string, { score: string; feedback: string }>>>({});

  protected readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / 20)));
  protected readonly canImport = computed(() => !!this.pack() && this.checked() && (this.report()?.errors.length ?? 1) === 0);

  private searchTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.loadAll();
  }

  protected onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.report.set(null);
    this.checked.set(false);
    this.pack.set(null);

    if (!file) {
      this.fileName.set('');
      return;
    }

    this.fileName.set(file.name);
    file.text().then(
      (text) => {
        try {
          this.pack.set(JSON.parse(text));
        } catch {
          this.error.set('This file is not valid JSON.');
        }
      },
      () => this.error.set('The file could not be read.')
    );
  }

  protected check(): void {
    this.busy.set(true);
    this.error.set(null);

    this.api.check(this.pack()).subscribe({
      next: (report) => {
        this.report.set(report);
        this.checked.set(true);
        this.busy.set(false);
      },
      error: (e: unknown) => this.fail(e)
    });
  }

  protected runImport(publish: boolean): void {
    this.busy.set(true);
    this.error.set(null);

    this.api.import(this.pack(), publish).subscribe({
      next: (report) => {
        this.report.set(report);
        this.busy.set(false);
        if (report.imported) {
          this.checked.set(false);
          this.loadAll();
        }
      },
      error: (e: unknown) => this.fail(e)
    });
  }

  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.search.set(value);
      this.go(1);
    }, 300);
  }

  protected setLevel(event: Event): void {
    this.level.set((event.target as HTMLSelectElement).value);
    this.go(1);
  }

  protected setStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value);
    this.go(1);
  }

  protected go(page: number): void {
    this.page.set(page);
    this.loadLessons();
  }

  protected toggle(row: AdminLesson): void {
    this.act(this.api.setPublished(row.id, row.status !== 'Published'));
  }

  protected remove(row: AdminLesson): void {
    this.act(this.api.remove(row.id));
  }

  protected draftScore(id: string): string {
    return this.drafts()[id]?.score ?? '';
  }

  protected draftFeedback(id: string): string {
    return this.drafts()[id]?.feedback ?? '';
  }

  protected setDraft(id: string, field: 'score' | 'feedback', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const current = this.drafts()[id] ?? { score: '', feedback: '' };
    this.drafts.update((all) => ({ ...all, [id]: { ...current, [field]: value } }));
  }

  protected sendReview(item: AdminWriting): void {
    const draft = this.drafts()[item.id];
    const score = draft?.score.trim() ? Number(draft.score) : null;

    this.busy.set(true);
    this.error.set(null);

    this.api.reviewWriting(item.id, score, draft?.feedback ?? '').subscribe({
      next: () => {
        this.busy.set(false);
        this.loadWriting();
      },
      error: (e: unknown) => this.fail(e)
    });
  }

  protected countsText(report: ImportReport): string {
    return Object.entries(report.counts)
      .map(([key, value]) => `${value} ${key}`)
      .join(' · ');
  }

  private act(request: import('rxjs').Observable<void>): void {
    this.busy.set(true);
    this.error.set(null);

    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.loadAll();
      },
      error: (e: unknown) => this.fail(e)
    });
  }

  private loadAll(): void {
    this.api.stats().subscribe({ next: (value) => this.stats.set(value), error: (e: unknown) => this.fail(e) });
    this.api.examPool().subscribe({ next: (value) => this.pool.set(value), error: () => undefined });
    this.loadLessons();
    this.loadWriting();
  }

  private loadLessons(): void {
    this.api
      .lessons({ search: this.search(), level: this.level(), status: this.status(), page: this.page() })
      .subscribe({
        next: (result) => {
          this.lessons.set(result.items);
          this.total.set(result.total);
        },
        error: (e: unknown) => this.fail(e)
      });
  }

  private loadWriting(): void {
    this.api.pendingWriting().subscribe({ next: (value) => this.writing.set(value), error: () => undefined });
  }

  private fail(e: unknown): void {
    this.busy.set(false);
    this.error.set(toApiError(e).message);
  }
}