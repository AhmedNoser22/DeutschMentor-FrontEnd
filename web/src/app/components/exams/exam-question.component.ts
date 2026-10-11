import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { ExerciseType } from '../../domain/enums/practice.enums';
import { PAIR_SEPARATOR } from '../../models/exercises/exercise.models';
import { ExamQuestion } from '../../models/exams/exam.models';

interface BankItem {
  word: string;
  index: number;
}

interface PairItem {
  left: string;
  right: string;
}

const NO_ANSWER: readonly string[] = [];

@Component({
  selector: 'dm-exam-question',
  template: `
    @switch (exercise().type) {
      @case (ExerciseType.MultipleChoice) {
        <h3 class="prompt">{{ exercise().prompt }}</h3>
        <div class="options" role="radiogroup" [attr.aria-label]="exercise().prompt">
          @for (option of exercise().options; track $index) {
            <button
              type="button"
              role="radio"
              class="option"
              [class.selected]="answer()[0] === option"
              [attr.aria-checked]="answer()[0] === option"
              (click)="choose(option)"
            >
              <span class="letter">{{ letters[$index] }}</span>
              <span>{{ option }}</span>
            </button>
          }
        </div>
      }

      @case (ExerciseType.TrueFalse) {
        <h3 class="prompt">{{ exercise().prompt }}</h3>
        <div class="tf" role="radiogroup">
          <button type="button" role="radio" class="option" [class.selected]="answer()[0] === 'true'" [attr.aria-checked]="answer()[0] === 'true'" (click)="choose('true')">True</button>
          <button type="button" role="radio" class="option" [class.selected]="answer()[0] === 'false'" [attr.aria-checked]="answer()[0] === 'false'" (click)="choose('false')">False</button>
        </div>
      }

      @case (ExerciseType.FillBlank) {
        <p class="prompt fill">
          @for (part of parts(); track $index; let last = $last) {
            <span>{{ part }}</span>
            @if (!last) {
              <input
                class="blank"
                type="text"
                autocomplete="off"
                autocapitalize="none"
                spellcheck="false"
                [attr.aria-label]="'Blank ' + ($index + 1)"
                [value]="answer()[$index]"
                (input)="setBlank($index, $event)"
              />
            }
          }
        </p>
      }

      @case (ExerciseType.Ordering) {
        <h3 class="prompt">{{ exercise().prompt }}</h3>
        <div class="line">
          @for (word of answer(); track $index) {
            <button type="button" class="chip" (click)="unplace($index)">{{ word }}</button>
          } @empty {
            <span class="muted">Tap the words below to build the sentence.</span>
          }
        </div>
        <div class="bank">
          @for (item of bank(); track item.index) {
            <button type="button" class="chip" (click)="place(item.word)">{{ item.word }}</button>
          }
        </div>
      }

      @case (ExerciseType.Matching) {
        <h3 class="prompt">{{ exercise().prompt }}</h3>
        <div class="match">
          <div class="col">
            @for (item of exercise().left; track $index) {
              <button
                type="button"
                class="mbtn"
                [class.active]="activeLeft() === item"
                [class.paired]="rightOf(item) !== null"
                (click)="pickLeft(item)"
              >
                <strong>{{ item }}</strong>
                @if (rightOf(item); as right) {
                  <span class="to">= {{ right }}</span>
                }
              </button>
            }
          </div>
          <div class="col">
            @for (item of exercise().right; track $index) {
              <button type="button" class="mbtn" [disabled]="rightUsed(item)" (click)="pickRight(item)">{{ item }}</button>
            }
          </div>
        </div>
      }
    }
  `,
  styles: [
    `
      :host { display: grid; gap: 1rem; }
      .prompt { font-family: var(--font-display); font-size: clamp(1.5rem, 4.5vw, 2.1rem); font-weight: 700; line-height: 1.2; }
      .fill { font-size: clamp(1.5rem, 4.5vw, 2.1rem); }
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
      .tf .option { min-width: 100px; justify-content: center; border-color: var(--line-strong); }
      .option.selected { border-color: var(--ink); background: var(--gold-soft); }
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
      .to { color: var(--muted); font-size: 0.9rem; }
    `
  ]
})
export class ExamQuestionComponent {
  readonly question = input.required<ExamQuestion>();
  readonly answer = input<readonly string[]>(NO_ANSWER);
  readonly answerChange = output<string[]>();

  protected readonly ExerciseType = ExerciseType;
  protected readonly letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  protected readonly exercise = computed(() => this.question().exercise);
  protected readonly parts = computed(() => this.exercise().prompt.split('___'));

  protected readonly activeLeft = linkedSignal<string | null>(() => {
    this.question();
    return null;
  });

  protected readonly bank = computed<BankItem[]>(() => {
    const used = [...this.answer()];
    return this.exercise()
      .words.map((word, index) => ({ word, index }))
      .filter((item) => {
        const at = used.indexOf(item.word);
        if (at >= 0) {
          used.splice(at, 1);
          return false;
        }
        return true;
      });
  });

  protected readonly pairs = computed<PairItem[]>(() =>
    this.answer().map((item) => {
      const [left, ...rest] = item.split(PAIR_SEPARATOR);
      return { left, right: rest.join(PAIR_SEPARATOR) };
    })
  );

  protected choose(value: string): void {
    this.answerChange.emit([value]);
  }

  protected setBlank(index: number, event: Event): void {
    const next = Array.from({ length: this.exercise().blankCount }, (_, i) => this.answer()[i] ?? '');
    next[index] = (event.target as HTMLInputElement).value;
    this.answerChange.emit(next);
  }

  protected place(word: string): void {
    this.answerChange.emit([...this.answer(), word]);
  }

  protected unplace(slot: number): void {
    const next = [...this.answer()];
    next.splice(slot, 1);
    this.answerChange.emit(next);
  }

  protected rightOf(left: string): string | null {
    return this.pairs().find((pair) => pair.left === left)?.right ?? null;
  }

  protected rightUsed(right: string): boolean {
    return this.pairs().some((pair) => pair.right === right);
  }

  protected pickLeft(left: string): void {
    if (this.rightOf(left) !== null) {
      this.answerChange.emit(this.answer().filter((item) => !item.startsWith(`${left}${PAIR_SEPARATOR}`)));
      this.activeLeft.set(null);
      return;
    }
    this.activeLeft.set(left);
  }

  protected pickRight(right: string): void {
    const left = this.activeLeft();
    if (left === null || this.rightUsed(right)) {
      return;
    }
    this.answerChange.emit([...this.answer(), `${left}${PAIR_SEPARATOR}${right}`]);
    this.activeLeft.set(null);
  }
}