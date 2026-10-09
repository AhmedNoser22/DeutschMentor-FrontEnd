import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExamState } from '../../domain/enums/learning.enums';
import { CefrLevel } from '../../domain/enums/user.enums';
import { LevelExam } from '../../models/learning/learning.models';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'dm-exam-card',
  imports: [RouterLink, IconComponent],
  template: `
    <section class="card exam">
      <div class="top">
        <h2>{{ levelCode() }} exam</h2>
        @switch (exam().state) {
          @case (ExamState.Passed) {
            <span class="badge badge-success"><dm-icon name="check" /> Passed {{ score() }}%</span>
          }
          @case (ExamState.Ready) {
            <span class="badge badge-gold">Ready</span>
          }
          @default {
            <span class="badge"><dm-icon name="lock" /> Locked</span>
          }
        }
      </div>

      <div class="progress"><span [style.width.%]="percent()"></span></div>
      <p class="muted">{{ message() }}</p>

      @if (exam().state === ExamState.Ready) {
        <a class="btn btn-primary" routerLink="/exams">Start exam</a>
      }
      @if (exam().state === ExamState.Passed) {
        <a class="btn btn-outline" routerLink="/certificates">View certificate</a>
      }
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .exam { display: grid; gap: 0.9rem; justify-items: start; }
      .top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; width: 100%; }
      .top h2 { font-size: 1.6rem; }
      .progress { width: 100%; }
      dm-icon { width: 1rem; height: 1rem; }
    `
  ]
})
export class ExamCardComponent {
  readonly exam = input.required<LevelExam>();
  readonly levelCode = input.required<CefrLevel>();
  readonly completed = input(0);
  readonly total = input(0);
  readonly score = input<number | null>(null);

  protected readonly ExamState = ExamState;

  protected readonly percent = computed(() => {
    if (this.exam().state === ExamState.Passed) {
      return 100;
    }
    return this.total() > 0 ? Math.round((this.completed() / this.total()) * 100) : 0;
  });

  protected readonly message = computed(() => {
    const exam = this.exam();
    const code = this.levelCode();

    if (exam.state === ExamState.Passed) {
      return `You passed with ${this.score() ?? 0}%.`;
    }

    if (exam.state === ExamState.Ready) {
      return `All lessons finished. Pass mark ${exam.passMarkPercent}%.`;
    }

    const lessons = exam.lessonsRemaining === 1 ? '1 lesson' : `${exam.lessonsRemaining} lessons`;
    const outcome = exam.nextLevelCode
      ? `Passing opens ${exam.nextLevelCode}.`
      : `Passing earns your ${code} certificate.`;
    return `${lessons} to go. Pass mark ${exam.passMarkPercent}%. ${outcome}`;
  });
}