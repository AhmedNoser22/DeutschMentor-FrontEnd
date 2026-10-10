import { Component, DestroyRef, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toApiError } from '../../core/models/api-error.model';
import { ExerciseType } from '../../domain/enums/practice.enums';
import {
  AnswerResult,
  ExerciseChecked,
  ExerciseItem,
  PAIR_SEPARATOR
} from '../../models/exercises/exercise.models';
import { ExerciseApiService } from '../../services/exercises/exercise-api.service';

const TYPE_LABELS: Record<ExerciseType, string> = {
  [ExerciseType.MultipleChoice]: 'Choose the right word',
  [ExerciseType.TrueFalse]: 'True or false',
  [ExerciseType.FillBlank]: 'Fill in the blank',
  [ExerciseType.Ordering]: 'Put the words in order',
  [ExerciseType.Matching]: 'Match the pairs'
};

@Component({
  selector: 'dm-exercise-card',
  template: `
    <div class="ex" [class.compact]="compact()">
      @if (!compact()) {
        <p class="eyebrow">
          @if (total() > 0) {
            Exercise {{ position() }} of {{ total() }} ·
          }
          {{ typeLabel() }}
        </p>
      }

      @switch (exercise().type) {
        @case (ExerciseType.MultipleChoice) {
          <h3 class="prompt">{{ exercise().prompt }}</h3>
          <div class="options">
            @for (option of exercise().options; track $index) {
              <button
                type="button"
                class="option"
                [class.selected]="chosen() === option && !result()"
                [class.correct]="optionState(option) === 'correct'"
                [class.wrong]="optionState(option) === 'wrong'"
                (click)="choose(option)"
              >
                <span class="letter">{{ letters[$index] }}</span>
                <span>{{ option }}</span>
              </button>
            }
          </div>
        }

        @case (ExerciseType.TrueFalse) {
          <h3 class="prompt">
            @if (compact()) {
              <strong>True or false:</strong>
            }
            {{ exercise().prompt }}
          </h3>
          <div class="tf">
            <button
              type="button"
              class="option"
              [class.selected]="chosen() === 'true' && !result()"
              [class.correct]="optionState('true') === 'correct'"
              [class.wrong]="optionState('true') === 'wrong'"
              (click)="choose('true')"
            >
              True
            </button>
            <button
              type="button"
              class="option"
              [class.selected]="chosen() === 'false' && !result()"
              [class.correct]="optionState('false') === 'correct'"
              [class.wrong]="optionState('false') === 'wrong'"
              (click)="choose('false')"
            >
              False
            </button>
          </div>
        }

        @case (ExerciseType.FillBlank) {
          <p class="prompt fill">
            @for (part of promptParts(); track $index; let last = $last) {
              <span>{{ part }}</span>
              @if (!last) {
                <input
                  class="blank"
                  type="text"
                  autocomplete="off"
                  autocapitalize="none"
                  spellcheck="false"
                  [class.good]="result()?.isCorrect === true"
                  [class.bad]="result()?.isCorrect === false"
                  [value]="blanks()[$index]"
                  [disabled]="!!result()"
                  [attr.aria-label]="'Blank ' + ($index + 1)"
                  (input)="setBlank($index, $event)"
                  (keydown.enter)="check()"
                />
              }
            }
          </p>
        }

        @case (ExerciseType.Ordering) {
          <h3 class="prompt">{{ exercise().prompt }}</h3>
          <div class="line" [class.good]="result()?.isCorrect === true" [class.bad]="result()?.isCorrect === false">
            @for (index of picked(); track index) {
              <button type="button" class="chip" [disabled]="!!result()" (click)="unplace(index)">{{ exercise().words[index] }}</button>
            } @empty {
              <span class="muted">Tap the words below to build the sentence.</span>
            }
          </div>
          <div class="bank">
            @for (word of exercise().words; track $index) {
              @if (!picked().includes($index)) {
                <button type="button" class="chip" [disabled]="!!result()" (click)="place($index)">{{ word }}</button>
              }
            }
          </div>
        }

        @case (ExerciseType.Matching) {
          <h3 class="prompt">{{ exercise().prompt }}</h3>
          <div class="match">
            <div class="col">
              @for (item of exercise().left; track $index) {
                @let paired = pairOf($index);
                <button
                  type="button"
                  class="mbtn"
                  [class.active]="activeLeft() === $index"
                  [class.paired]="paired !== null"
                  [class.correct]="result()?.isCorrect === true"
                  [class.wrong]="result()?.isCorrect === false"
                  (click)="pickLeft($index)"
                >
                  <strong>{{ item }}</strong>
                  @if (paired !== null) {
                    <span class="to">= {{ exercise().right[paired] }}</span>
                  }
                </button>
              }
            </div>
            <div class="col">
              @for (item of exercise().right; track $index) {
                <button type="button" class="mbtn" [disabled]="rightUsed($index) || !!result()" (click)="pickRight($index)">{{ item }}</button>
              }
            </div>
          </div>
        }
      }

      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }

      @if (result(); as r) {
        <div class="feedback" [class.good]="r.isCorrect" [class.bad]="!r.isCorrect" role="status">
          <strong>{{ r.isCorrect ? 'Correct!' : 'Not quite. The answer is ' + correctText() + '.' }}</strong>
          @if (r.explanationEn) {
            <p>{{ r.explanationEn }}</p>
          }
          @if (r.explanationAr) {
            <p class="ar" lang="ar" dir="rtl">{{ r.explanationAr }}</p>
          }
        </div>
      }

      <div class="actions">
        @if (!result() && needsCheck()) {
          <button type="button" class="btn btn-primary" [disabled]="!canCheck() || busy()" (click)="check()">
            {{ busy() ? 'Checking...' : 'Check' }}
          </button>
        }
        @if (result() && !result()!.isCorrect) {
          <button type="button" class="btn btn-primary" (click)="retry()">Try again</button>
        }
        @if (result()?.isCorrect && continueLabel()) {
          <button type="button" class="btn btn-primary" (click)="continued.emit()">{{ continueLabel() }}</button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .ex { display: grid; gap: 1rem; }
      .prompt { font-family: var(--font-display); font-size: clamp(1.6rem, 5vw, 2.2rem); font-weight: 700; line-height: 1.2; }
      .compact .prompt { font-family: var(--font-body); font-size: 1.05rem; font-weight: 400; }
      .fill { font-size: clamp(1.6rem, 5vw, 2.2rem); }

      .options { display: grid; gap: 0.6rem; }
      .tf { display: flex; gap: 0.6rem; }
      .option {
        display: flex;
        align-items: center;
        gap: 0.9rem;
        min-height: 52px;
        padding: 0.5rem 1rem;
        text-align: left;
        background: var(--surface);
        border: 1.5px solid var(--line);
        border-radius: var(--radius-md);
        cursor: pointer;
      }
      .tf .option { flex: 0 0 auto; min-width: 96px; justify-content: center; border-color: var(--line-strong); }
      .option.selected { border-color: var(--ink); }
      .option.correct { background: var(--success-soft); border-color: var(--success); color: var(--success); }
      .option.wrong { background: var(--danger-soft); border-color: var(--danger); color: var(--danger); }
      .letter {
        display: grid;
        place-items: center;
        flex: none;
        width: 30px;
        height: 30px;
        border-radius: 6px;
        background: var(--surface-2);
        font-size: 0.85rem;
        font-weight: 600;
      }

      .blank {
        width: 7.5rem;
        min-height: 44px;
        margin: 0 0.35rem;
        padding: 0 0.6rem;
        font-size: 1.2rem;
        text-align: center;
        background: var(--surface);
        border: 0;
        border-bottom: 2px solid var(--line-strong);
        border-radius: 6px 6px 0 0;
      }
      .blank.good { border-color: var(--success); color: var(--success); }
      .blank.bad { border-color: var(--danger); color: var(--danger); }

      .line {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        min-height: 64px;
        padding: 0.75rem;
        background: var(--surface-2);
        border: 1.5px dashed var(--line);
        border-radius: var(--radius-md);
      }
      .line.good { border-color: var(--success); }
      .line.bad { border-color: var(--danger); }
      .bank { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .chip {
        min-height: 44px;
        padding: 0 1rem;
        font-weight: 600;
        background: var(--surface);
        border: 1.5px solid var(--line-strong);
        border-radius: var(--radius-sm);
        cursor: pointer;
      }
      .chip:disabled { cursor: default; opacity: 0.8; }

      .match { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      .col { display: grid; gap: 0.6rem; align-content: start; }
      .mbtn {
        display: grid;
        gap: 0.15rem;
        min-height: 52px;
        padding: 0.5rem 0.9rem;
        text-align: left;
        background: var(--surface);
        border: 1.5px solid var(--line);
        border-radius: var(--radius-md);
        cursor: pointer;
      }
      .mbtn:disabled { opacity: 0.45; cursor: default; }
      .mbtn.active { border-color: var(--ink); background: var(--gold-soft); }
      .mbtn.paired { border-color: var(--ink); }
      .mbtn.correct { background: var(--success-soft); border-color: var(--success); }
      .mbtn.wrong { background: var(--danger-soft); border-color: var(--danger); }
      .to { color: var(--muted); font-size: 0.9rem; }

      .feedback { padding: 1rem 1.1rem; border-radius: var(--radius-md); }
      .feedback p { margin-top: 0.35rem; }
      .feedback.good { background: var(--success-soft); color: var(--success); }
      .feedback.bad { background: var(--danger-soft); color: var(--danger); }
      .ar { direction: rtl; text-align: right; }
      .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
      .alert { margin: 0; }
    `
  ]
})
export class ExerciseCardComponent {
  private readonly api = inject(ExerciseApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly exercise = input.required<ExerciseItem>();
  readonly position = input(0);
  readonly total = input(0);
  readonly compact = input(false);
  readonly continueLabel = input('');
  readonly checked = output<ExerciseChecked>();
  readonly continued = output<void>();

  protected readonly ExerciseType = ExerciseType;
  protected readonly letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  protected readonly chosen = this.resetting<string | null>(() => null);
  protected readonly blanks = this.resetting<string[]>(() =>
    Array.from({ length: this.exercise().blankCount }, () => '')
  );
  protected readonly picked = this.resetting<number[]>(() => []);
  protected readonly pairs = this.resetting<Record<number, number>>(() => ({}));
  protected readonly activeLeft = this.resetting<number | null>(() => null);
  protected readonly result = this.resetting<AnswerResult | null>(() => null);
  protected readonly attempts = this.resetting<number>(() => 0);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly typeLabel = computed(() => TYPE_LABELS[this.exercise().type]);
  protected readonly promptParts = computed(() => this.exercise().prompt.split('___'));
  protected readonly needsCheck = computed(() => {
    const type = this.exercise().type;
    return type === ExerciseType.FillBlank || type === ExerciseType.Ordering || type === ExerciseType.Matching;
  });

  protected readonly canCheck = computed(() => {
    const exercise = this.exercise();
    switch (exercise.type) {
      case ExerciseType.FillBlank:
        return this.blanks().length > 0 && this.blanks().every((value) => value.trim().length > 0);
      case ExerciseType.Ordering:
        return this.picked().length === exercise.words.length;
      case ExerciseType.Matching:
        return Object.keys(this.pairs()).length === exercise.left.length;
      default:
        return false;
    }
  });

  protected readonly correctText = computed(() => {
    const result = this.result();
    if (!result) {
      return '';
    }

    switch (this.exercise().type) {
      case ExerciseType.TrueFalse:
        return result.correctAnswer[0] === 'true' ? 'True' : 'False';
      case ExerciseType.FillBlank:
        return result.correctAnswer.join(' / ');
      case ExerciseType.Ordering:
        return result.correctAnswer.join(' ');
      case ExerciseType.Matching:
        return result.correctAnswer.map((pair) => pair.split(PAIR_SEPARATOR).join(' = ')).join('; ');
      default:
        return result.correctAnswer[0] ?? '';
    }
  });

  protected optionState(value: string): 'correct' | 'wrong' | null {
    const result = this.result();
    if (!result) {
      return null;
    }
    if (result.correctAnswer[0] === value) {
      return 'correct';
    }
    return this.chosen() === value ? 'wrong' : null;
  }

  protected choose(value: string): void {
    if (this.result() || this.busy()) {
      return;
    }
    this.chosen.set(value);
    this.submit([value]);
  }

  protected setBlank(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.blanks.update((current) => current.map((item, i) => (i === index ? value : item)));
  }

  protected place(index: number): void {
    if (!this.result()) {
      this.picked.update((current) => [...current, index]);
    }
  }

  protected unplace(index: number): void {
    if (!this.result()) {
      this.picked.update((current) => current.filter((item) => item !== index));
    }
  }

  protected pairOf(left: number): number | null {
    const right = this.pairs()[left];
    return right === undefined ? null : right;
  }

  protected rightUsed(right: number): boolean {
    return Object.values(this.pairs()).includes(right);
  }

  protected pickLeft(left: number): void {
    if (this.result()) {
      return;
    }

    if (this.pairOf(left) !== null) {
      this.pairs.update((current) => {
        const next = { ...current };
        delete next[left];
        return next;
      });
      this.activeLeft.set(null);
      return;
    }

    this.activeLeft.set(left);
  }

  protected pickRight(right: number): void {
    const left = this.activeLeft();
    if (this.result() || left === null || this.rightUsed(right)) {
      return;
    }
    this.pairs.update((current) => ({ ...current, [left]: right }));
    this.activeLeft.set(null);
  }

  protected check(): void {
    if (!this.needsCheck() || !this.canCheck() || this.busy() || this.result()) {
      return;
    }
    this.submit(this.buildAnswer());
  }

  protected retry(): void {
    this.result.set(null);
    this.chosen.set(null);
    this.picked.set([]);
    this.pairs.set({});
    this.activeLeft.set(null);
    this.error.set(null);
  }

  private buildAnswer(): string[] {
    const exercise = this.exercise();
    switch (exercise.type) {
      case ExerciseType.FillBlank:
        return this.blanks().map((value) => value.trim());
      case ExerciseType.Ordering:
        return this.picked().map((index) => exercise.words[index]);
      case ExerciseType.Matching:
        return exercise.left.map((left, i) => `${left}${PAIR_SEPARATOR}${exercise.right[this.pairs()[i]]}`);
      default:
        return [];
    }
  }

  private submit(answer: string[]): void {
    this.busy.set(true);
    this.error.set(null);

    this.api
      .submit(this.exercise().id, answer)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          const firstTry = this.attempts() === 0;
          this.attempts.update((value) => value + 1);
          this.result.set(result);
          this.busy.set(false);
          this.checked.emit({ exerciseId: this.exercise().id, correct: result.isCorrect, firstTry });
        },
        error: (e: unknown) => {
          this.busy.set(false);
          this.chosen.set(null);
          this.error.set(toApiError(e).message);
        }
      });
  }

  private resetting<T>(initial: () => T) {
    return linkedSignal<T>(() => {
      this.exercise();
      return initial();
    });
  }
}