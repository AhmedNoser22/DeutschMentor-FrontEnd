import { ExerciseItem } from '../exercises/exercise.models';

export interface ReadingLine {
  speaker: string | null;
  text: string;
}

export interface ReadingPassage {
  id: string;
  title: string;
  lines: ReadingLine[];
  questions: ExerciseItem[];
  solvedQuestionIds: string[];
}