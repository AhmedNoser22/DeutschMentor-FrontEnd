import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Certificate } from '../../models/certificates/certificate.models';

@Component({
  selector: 'dm-certificate-view',
  imports: [DatePipe],
  template: `
    @let c = certificate();
    <article class="paper" [attr.aria-label]="'Certificate for level ' + c.levelCode">
      <div class="frame">
        <header class="head">
          <span class="brand">
            <svg viewBox="0 0 40 36" width="34" height="30" aria-hidden="true">
              <rect x="0" y="0" width="18" height="10" fill="#14171c" />
              <rect x="0" y="13" width="28" height="10" fill="#c8231c" />
              <rect x="0" y="26" width="40" height="10" fill="#e8b000" />
            </svg>
            <span class="word">DeutschMentor</span>
          </span>
          <span class="tag">LEVEL {{ c.levelCode }} · CEFR</span>
        </header>

        <div class="body">
          <p class="small">CERTIFICATE OF ACHIEVEMENT</p>
          <h2 class="title">Zertifikat</h2>
          <p class="small">THIS CERTIFIES THAT</p>
          <p class="name" dir="auto">{{ c.recipientName }}</p>
          <p class="text">
            has passed the DeutschMentor Level {{ c.levelCode }} exam, {{ c.germanLevelName }}, with a score of
            {{ c.scorePercent }}%, and has completed all lessons of the level.
          </p>
        </div>

        <footer class="foot">
          <div class="meta">
            <span class="small">ISSUED</span>
            <strong>{{ c.issuedAtUtc | date: 'd MMMM y' : 'UTC' }}</strong>
            <span class="small gap">CERTIFICATE ID</span>
            <strong class="id">{{ c.code }}</strong>
          </div>
          <div class="seal">
            <span class="lv">{{ c.levelCode }}</span>
            <span class="bd">BESTANDEN</span>
          </div>
        </footer>
      </div>
    </article>
  `,
  styles: [
    `
      :host { display: block; }
      .paper { padding: 0.5rem; background: #ffffff; color: #14171c; border: 1px solid var(--line); border-radius: var(--radius-md); }
      .frame { display: grid; gap: 1.5rem; padding: clamp(1rem, 4vw, 2.5rem); border: 3px solid #14171c; outline: 1.5px solid #e8b000; outline-offset: -9px; }
      .head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; }
      .brand { display: inline-flex; align-items: center; gap: 0.6rem; }
      .word { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; }
      .tag, .small { font-size: 0.7rem; font-weight: 500; letter-spacing: 0.18em; color: #5d6673; }
      .body { display: grid; gap: 0.35rem; }
      .title { font-family: var(--font-display); font-size: clamp(3.2rem, 14vw, 6rem); font-weight: 700; line-height: 0.95; }
      .name { padding-bottom: 0.4rem; font-family: var(--font-display); font-size: clamp(1.9rem, 7vw, 3rem); font-weight: 700; border-bottom: 2px solid #14171c; overflow-wrap: anywhere; }
      .text { max-width: 36rem; margin-top: 0.75rem; font-size: clamp(1rem, 2.6vw, 1.15rem); }
      .foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; }
      .meta { display: grid; gap: 0.1rem; }
      .meta strong { font-size: 1.1rem; }
      .gap { margin-top: 0.5rem; }
      .id { overflow-wrap: anywhere; }
      .seal {
        display: grid;
        place-content: center;
        justify-items: center;
        flex: none;
        width: clamp(84px, 20vw, 118px);
        aspect-ratio: 1;
        background: #e8b000;
        border-radius: 50%;
        box-shadow: inset 0 0 0 5px #e8b000, inset 0 0 0 7px #14171c;
      }
      .lv { font-family: var(--font-display); font-size: clamp(1.6rem, 6vw, 2.4rem); font-weight: 700; line-height: 1; }
      .bd { font-size: 0.55rem; font-weight: 600; letter-spacing: 0.16em; }
    `
  ]
})
export class CertificateViewComponent {
  readonly certificate = input.required<Certificate>();
}