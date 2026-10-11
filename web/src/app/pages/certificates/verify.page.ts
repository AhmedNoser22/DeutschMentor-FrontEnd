import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../components/auth/auth-layout.component';
import { toApiError } from '../../core/models/api-error.model';
import { VerifyCertificateResult } from '../../models/certificates/certificate.models';
import { CertificateApiService } from '../../services/certificates/certificate-api.service';

@Component({
  selector: 'dm-verify-page',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, AuthLayoutComponent],
  template: `
    <dm-auth-layout [showTabs]="false">
      <h2 class="auth-title">Verify a certificate</h2>
      <p class="muted" style="margin-bottom: 1.25rem">Enter the certificate ID printed on the certificate.</p>

      <form class="stack" (submit)="onSubmit($event)">
        <div class="field">
          <label for="code">Certificate ID</label>
          <input
            id="code"
            class="input"
            type="text"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            placeholder="DM-A1-2026-XXXXXXXX"
            [formControl]="code"
          />
        </div>

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading() || !code.value.trim()">
          {{ loading() ? 'Checking...' : 'Verify' }}
        </button>
      </form>

      @if (error()) {
        <div class="alert alert-error" role="alert" style="margin-top: 1rem">{{ error() }}</div>
      }

      @if (result(); as r) {
        @if (r.valid) {
          <article class="card valid" role="status">
            <span class="badge badge-success">Valid certificate</span>
            <h3 dir="auto">{{ r.recipientName }}</h3>
            <p>Level {{ r.levelCode }} · {{ r.germanLevelName }} · {{ r.scorePercent }}%</p>
            <p class="muted">Issued {{ r.issuedAtUtc | date: 'd MMMM y' : 'UTC' }} · {{ r.code }}</p>
          </article>
        } @else {
          <div class="alert alert-error" role="status" style="margin-top: 1rem">
            No certificate matches this ID. Check the ID and try again.
          </div>
        }
      }

      <p class="center-row"><a class="link" routerLink="/auth/sign-in">Back to DeutschMentor</a></p>
    </dm-auth-layout>
  `,
  styles: [
    `
      .valid { display: grid; gap: 0.5rem; justify-items: start; margin-top: 1.25rem; }
      .valid h3 { font-size: 2.2rem; overflow-wrap: anywhere; }
    `
  ]
})
export class VerifyPage {
  private readonly api = inject(CertificateApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly code = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(40)]
  });
  protected readonly result = signal<VerifyCertificateResult | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    const initial = this.route.snapshot.paramMap.get('code');
    if (initial) {
      this.code.setValue(initial);
      this.verify();
    }
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.verify();
  }

  private verify(): void {
    const value = this.code.value.trim().toUpperCase();
    if (!value || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);

    this.api.verify(value).subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        this.error.set(toApiError(e).message);
      }
    });
  }
}