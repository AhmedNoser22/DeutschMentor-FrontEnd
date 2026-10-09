import { Component, input } from '@angular/core';
import { LevelDetail, LevelRequirements } from '../../models/learning/learning.models';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'dm-locked-level',
  imports: [IconComponent],
  template: `
    <section class="card locked">
      <div class="art"><dm-icon name="lock" /></div>
      <div class="info">
        @if (detail().requirements; as req) {
          <h2>{{ detail().summary.code }} opens after the {{ req.previousLevelCode }} exam</h2>
          <p class="muted">
            Finish every {{ req.previousLevelCode }} lesson, then pass the {{ req.previousLevelCode }} exam with
            {{ detail().exam.passMarkPercent }}% or more. Your {{ req.previousLevelCode }} certificate is issued as
            soon as you pass.
          </p>
          <ul class="reqs">
            <li>
              <span [class]="'badge ' + (lessonsDone(req) ? 'badge-success' : 'badge-danger')">
                {{ req.previousCompletedLessons }} of {{ req.previousTotalLessons }} lessons
              </span>
              Finish every lesson in {{ req.previousLevelCode }}
            </li>
            <li>
              <span [class]="'badge ' + (req.previousExamPassed ? 'badge-success' : '')">
                {{ req.previousExamPassed ? 'Passed' : 'Not taken' }}
              </span>
              Pass the {{ req.previousLevelCode }} exam
            </li>
          </ul>
        }
      </div>
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .locked { display: grid; gap: 1.25rem; }
      .art { display: grid; place-items: center; min-height: 110px; border-radius: var(--radius-md); background: var(--surface-2); color: var(--muted); }
      .art dm-icon { width: 2.25rem; height: 2.25rem; }
      .info { display: grid; gap: 0.75rem; align-content: start; }
      .info h2 { font-size: 1.8rem; }
      .reqs { display: grid; gap: 0.6rem; margin: 0.25rem 0 0; padding: 0; list-style: none; }
      .reqs li { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
      @media (min-width: 900px) {
        .locked { grid-template-columns: 1fr 1.2fr; align-items: stretch; }
      }
    `
  ]
})
export class LockedLevelComponent {
  readonly detail = input.required<LevelDetail>();

  protected lessonsDone(req: LevelRequirements): boolean {
    return req.previousTotalLessons > 0 && req.previousCompletedLessons >= req.previousTotalLessons;
  }
}