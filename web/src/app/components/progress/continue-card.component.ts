import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LevelStatus } from '../../domain/enums/learning.enums';
import { CefrLevel } from '../../domain/enums/user.enums';
import { LevelSummary } from '../../models/learning/learning.models';
import { ContinueLesson } from '../../models/progress/progress.models';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'dm-continue-card',
  imports: [RouterLink, IconComponent],
  template: `
    <section class="continue">
      <div class="text">
        @if (lesson(); as l) {
          <p class="eyebrow">Continue · {{ l.levelCode }} · Module {{ l.moduleOrder }} · Unit {{ l.unitOrder }}</p>
          <h2>{{ l.title }}</h2>
          <p class="sub">{{ l.titleEn }} · <span lang="ar" dir="rtl">{{ l.titleAr }}</span></p>
          <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="percent()">
            <span [style.width.%]="percent()"></span>
          </div>
          <p class="meta">{{ l.stepsDone }} of {{ l.totalSteps }} steps done · about {{ l.minutesLeft }} min left</p>
          <a class="btn btn-primary" [routerLink]="['/learn/lesson', l.lessonId]">
            Continue lesson <dm-icon name="arrow-right" />
          </a>
        } @else if (examReady(); as code) {
          <p class="eyebrow">Next step</p>
          <h2>Take the {{ code }} exam</h2>
          <p class="sub">Every lesson in this level is finished.</p>
          <a class="btn btn-primary" routerLink="/exams">Go to exams <dm-icon name="arrow-right" /></a>
        } @else {
          <p class="eyebrow">Learning path</p>
          <h2>Pick your next lesson</h2>
          <p class="sub">Open your path to see what is available.</p>
          <a class="btn btn-primary" routerLink="/learn">Open learning path <dm-icon name="arrow-right" /></a>
        }
      </div>

      <div class="art" aria-hidden="true">
        <span class="circle"></span>
        <span class="square"></span>
        <span class="triangle"></span>
      </div>
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .continue {
        position: relative;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        padding: 1.5rem;
        overflow: hidden;
        color: #ffffff;
        background: #14171c;
        border: 1px solid #272c34;
        border-radius: var(--radius-lg);
      }
      .text { position: relative; z-index: 1; display: grid; flex: 1; gap: 0.55rem; align-content: start; justify-items: start; }
      .eyebrow { color: #aeb4bd; }
      h2 { font-size: clamp(2rem, 6vw, 2.8rem); }
      .sub { color: #c4cad2; }
      .bar { width: 100%; height: 8px; background: #272c34; border-radius: 999px; overflow: hidden; }
      .bar span { display: block; height: 100%; background: var(--primary); border-radius: inherit; }
      .meta { font-size: 0.95rem; color: #aeb4bd; }
      .btn { margin-top: 0.5rem; }
      .btn dm-icon { width: 1.15rem; height: 1.15rem; }
      .art { position: absolute; inset: 0 0 0 auto; width: 38%; max-width: 240px; opacity: 0.9; }
      .circle { position: absolute; top: 14%; right: 14%; width: 96px; height: 96px; background: #c8231c; border-radius: 50%; }
      .square { position: absolute; top: 44%; right: 38%; width: 66px; height: 66px; background: #e8b000; }
      .triangle {
        position: absolute;
        top: 42%;
        right: 8%;
        width: 0;
        height: 0;
        border-right: 34px solid transparent;
        border-bottom: 58px solid #eef0f4;
        border-left: 34px solid transparent;
      }
      @media (max-width: 599px) {
        .art { opacity: 0.35; }
      }
    `
  ]
})
export class ContinueCardComponent {
  readonly lesson = input<ContinueLesson | null>(null);
  readonly level = input<LevelSummary | null>(null);

  protected readonly percent = computed(() => {
    const lesson = this.lesson();
    return lesson && lesson.totalSteps > 0 ? Math.round((lesson.stepsDone / lesson.totalSteps) * 100) : 0;
  });

  protected readonly examReady = computed<CefrLevel | null>(() => {
    const level = this.level();
    const ready =
      !!level &&
      level.status === LevelStatus.InProgress &&
      level.totalLessons > 0 &&
      level.completedLessons >= level.totalLessons;
    return ready ? level.code : null;
  });
}