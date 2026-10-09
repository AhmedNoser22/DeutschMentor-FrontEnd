import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'dm-coming-soon',
  template: `
    <section class="page">
      <p class="eyebrow">Coming soon</p>
      <h1 class="hello">{{ title }}</h1>
      <div class="card">
        <p>This section is built in {{ phase }}.</p>
      </div>
    </section>
  `
})
export class ComingSoonComponent {
  private readonly data = inject(ActivatedRoute).snapshot.data;
  readonly title = String(this.data['title'] ?? '');
  readonly phase = String(this.data['phase'] ?? 'a later phase');
}