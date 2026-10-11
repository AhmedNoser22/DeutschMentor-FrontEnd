import { Component, input } from '@angular/core';
import { MentorMessage } from '../../models/progress/progress.models';

@Component({
  selector: 'dm-mentor-card',
  template: `
    <section class="card mentor">
      <p class="eyebrow">Your mentor</p>
      @for (message of messages(); track message.title) {
        <div class="message">
          <h3>{{ message.title }}</h3>
          <p class="muted">{{ message.body }}</p>
        </div>
      }
      <p class="muted source">Built from your answers in the last 7 days.</p>
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .mentor { display: grid; gap: 0.9rem; }
      .message h3 { margin-bottom: 0.2rem; font-family: var(--font-body); font-size: 1.15rem; font-weight: 600; line-height: 1.25; letter-spacing: 0; }
      .source { padding-top: 0.25rem; font-size: 0.85rem; }
    `
  ]
})
export class MentorCardComponent {
  readonly messages = input.required<readonly MentorMessage[]>();
}