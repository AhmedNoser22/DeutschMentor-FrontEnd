import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StartPreference } from '../../domain/enums/user.enums';
import { AuthStore } from '../../state/auth/auth.store';

@Component({
  selector: 'dm-dashboard-page',
  imports: [RouterLink],
  template: `
    <section class="page">
      <p class="eyebrow">{{ dateLabel }}</p>
      <h1 class="hello">{{ greeting }}, {{ firstName() }}.</h1>

      <div class="grid-2">
        <article class="card">
          <p class="eyebrow">Your level</p>
          <h2 class="stat">{{ user()?.currentLevel }}</h2>
          <p class="muted">Keep going. Finish every lesson, then pass the level exam.</p>
        </article>

        <article class="card">
          <p class="eyebrow">Starting point</p>
          <h2 class="stat">{{ startLabel() }}</h2>
          <p class="muted">Chosen when you created your account.</p>
        </article>
      </div>

      <article class="card stack">
        <p class="eyebrow">Continue</p>
        <p class="muted">Pick up your lessons where you stopped.</p>
        <div><a class="btn btn-primary" routerLink="/learn">Open learning path</a></div>
      </article>
    </section>
  `
})
export class DashboardPage {
  private readonly store = inject(AuthStore);

  protected readonly user = this.store.user;
  protected readonly firstName = computed(() => (this.user()?.fullName ?? '').split(' ')[0]);
  protected readonly startLabel = computed(() =>
    this.user()?.startPreference === StartPreference.PlacementTest ? 'Placement test' : 'From A1'
  );

  protected readonly dateLabel = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
    .format(new Date())
    .toUpperCase();

  protected readonly greeting = this.greetingFor(new Date().getHours());

  private greetingFor(hour: number): string {
    if (hour < 11) {
      return 'Guten Morgen';
    }
    return hour < 18 ? 'Guten Tag' : 'Guten Abend';
  }
}