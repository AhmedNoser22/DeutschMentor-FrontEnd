import { ExerciseType } from '../../domain/enums/practice.enums';

export const PAIR_SEPARATOR = '::';

export interface ExerciseItem {
  id: string;
  order: number;
  type: ExerciseType;
  prompt: string;
  options: string[];
  words: string[];
  left: string[];
  right: string[];
  blankCount: number;
}

export interface ExerciseSet {
  exercises: ExerciseItem[];
  solvedExerciseIds: string[];
}

export interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string[];
  explanationEn: string;
  explanationAr: string;
}

export interface ExerciseChecked {
  exerciseId: string;
  correct: boolean;
  firstTry: boolean;
}