import { formatDate } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CertificateViewComponent } from '../../components/certificates/certificate-view.component';
import { toApiError } from '../../core/models/api-error.model';
import { saveBlob } from '../../core/services/file-download';
import { CertificateSlotStatus } from '../../domain/enums/certificate.enums';
import { CefrLevel } from '../../domain/enums/user.enums';
import { Certificate, CertificateSlot } from '../../models/certificates/certificate.models';
import { CertificateApiService } from '../../services/certificates/certificate-api.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'dm-certificates-page',
  imports: [RouterLink, IconComponent, CertificateViewComponent],
  template: `
    <section class="page">
      <div class="page-head">
        <div>
          <p class="eyebrow">Certificates</p>
          <h1 class="hello">Your certificates</h1>
        </div>
        <p class="muted">One certificate for every level you pass.</p>
      </div>

      @if (loading()) {
        <p class="muted">Loading certificates...</p>
      } @else if (error() && !slots().length) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
        <button class="btn btn-outline" type="button" (click)="load()">Try again</button>
      } @else {
        <div class="tabs" role="tablist" aria-label="Levels">
          @for (slot of slots(); track slot.levelCode) {
            <button
              type="button"
              role="tab"
              class="tab"
              [class.selected]="slot.levelCode === selected()"
              [class.empty]="slot.status !== Status.Issued"
              [attr.aria-selected]="slot.levelCode === selected()"
              (click)="selected.set(slot.levelCode)"
            >
              <strong>{{ slot.levelCode }}</strong>
              <small>{{ caption(slot) }}</small>
            </button>
          }
        </div>

        @if (current(); as slot) {
          @switch (slot.status) {
            @case (Status.Issued) {
              @if (slot.certificate; as c) {
                <dm-certificate-view [certificate]="c" />

                @if (error()) {
                  <div class="alert alert-error" role="alert">{{ error() }}</div>
                }

                <div class="actions">
                  <button class="btn btn-primary" type="button" [disabled]="busy()" (click)="download(c)">
                    <dm-icon name="download" /> {{ busy() ? 'Preparing...' : 'Download PDF' }}
                  </button>
                  <button class="btn btn-outline" type="button" (click)="copy(c.code, 'Certificate ID')">
                    <dm-icon name="copy" /> Copy certificate ID
                  </button>
                  <button class="btn btn-outline" type="button" (click)="copy(verifyLink(c), 'Verification link')">
                    <dm-icon name="copy" /> Copy verification link
                  </button>
                </div>

                @if (notice()) {
                  <p class="notice" role="status">{{ notice() }}</p>
                }

                <p class="muted verify">
                  Anyone can check this certificate at
                  <a class="link" [routerLink]="['/verify', c.code]">the verification page</a>.
                </p>
              }
            }
            @case (Status.PlacementOnly) {
              <article class="card info">
                <h2>{{ slot.levelCode }} passed through the placement test</h2>
                <p class="muted">Certificates are issued only for level exams, so this level has no certificate.</p>
              </article>
            }
            @case (Status.NotPassed) {
              <article class="card info">
                <h2>{{ slot.levelCode }} is not passed yet</h2>
                <p class="muted">Finish every lesson, then pass the {{ slot.levelCode }} exam to earn this certificate.</p>
                <div><a class="btn btn-primary" routerLink="/exams">Go to exams</a></div>
              </article>
            }
            @case (Status.Locked) {
              <article class="card info">
                <h2>{{ slot.levelCode }} is locked</h2>
                <p class="muted">This level opens after you pass the exam of the level before it.</p>
              </article>
            }
          }
        }
      }
    </section>
  `,
  styles: [
    `
      .tabs { display: flex; gap: 0.75rem; padding-bottom: 0.7rem; margin-bottom: 1rem; overflow-x: auto; }
      .tab {
        display: grid;
        flex: 0 0 auto;
        min-width: 150px;
        gap: 0.15rem;
        padding: 0.8rem 1rem;
        text-align: left;
        background: var(--surface);
        border: 1.5px solid var(--line);
        border-radius: var(--radius-md);
        cursor: pointer;
      }
      .tab strong { font-family: var(--font-display); font-size: 1.6rem; line-height: 1; }
      .tab small { color: var(--muted); }
      .tab.empty { background: transparent; border-style: dashed; }
      .tab.selected { border-color: var(--ink); border-style: solid; box-shadow: 0 4px 0 var(--gold); }
      .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; }
      .actions dm-icon { width: 1.15rem; height: 1.15rem; }
      .notice { margin-top: 0.75rem; font-weight: 500; color: var(--success); }
      .verify { margin-top: 1rem; }
      .info { display: grid; gap: 0.75rem; justify-items: start; }
      .info h2 { font-size: 1.8rem; }
      .alert { margin-top: 1rem; }
      @media (min-width: 900px) {
        .tabs { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); overflow: visible; }
        .tab { min-width: 0; }
      }
    `
  ]
})
export class CertificatesPage {
  private readonly api = inject(CertificateApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly Status = CertificateSlotStatus;
  protected readonly slots = signal<CertificateSlot[]>([]);
  protected readonly selected = signal<CefrLevel | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly notice = signal<string | null>(null);

  protected readonly current = computed(() => this.slots().find((slot) => slot.levelCode === this.selected()) ?? null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.list().subscribe({
      next: (slots) => {
        this.slots.set(slots);

        const requested = this.route.snapshot.queryParamMap.get('level');
        const preferred =
          slots.find((slot) => slot.levelCode === requested) ??
          slots.find((slot) => slot.status === CertificateSlotStatus.Issued) ??
          slots[0];

        this.selected.set(preferred?.levelCode ?? null);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  protected caption(slot: CertificateSlot): string {
    switch (slot.status) {
      case CertificateSlotStatus.Issued:
        return slot.certificate
          ? `${slot.certificate.scorePercent}% · ${formatDate(slot.certificate.issuedAtUtc, 'd MMM y', 'en-US', 'UTC')}`
          : '';
      case CertificateSlotStatus.PlacementOnly:
        return 'Placement';
      case CertificateSlotStatus.NotPassed:
        return 'Not yet passed';
      default:
        return 'Locked';
    }
  }

  protected verifyLink(certificate: Certificate): string {
    return `${location.origin}/verify/${certificate.code}`;
  }

  protected download(certificate: Certificate): void {
    this.busy.set(true);
    this.error.set(null);

    this.api.pdf(certificate.id).subscribe({
      next: (blob) => {
        saveBlob(blob, `DeutschMentor-${certificate.levelCode}-Zertifikat.pdf`);
        this.busy.set(false);
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }

  protected async copy(text: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.notice.set(`${label} copied.`);
    } catch {
      this.notice.set('Copy is not available here. Select the text and copy it manually.');
    }

    setTimeout(() => this.notice.set(null), 2500);
  }
}