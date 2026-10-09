export enum LevelStatus {
  Locked = 'Locked',
  InProgress = 'InProgress',
  Passed = 'Passed'
}

export enum LessonState {
  Locked = 'Locked',
  Open = 'Open',
  Current = 'Current',
  Completed = 'Completed'
}

export enum ExamState {
  Locked = 'Locked',
  Ready = 'Ready',
  Passed = 'Passed'
}

export enum LessonStep {
  Vocabulary = 'Vocabulary',
  Grammar = 'Grammar',
  Practice = 'Practice',
  Reading = 'Reading',
  Writing = 'Writing'
}

export enum Article {
  Der = 'Der',
  Die = 'Die',
  Das = 'Das'
}

export enum PartOfSpeech {
  Noun = 'Noun',
  Verb = 'Verb',
  Adjective = 'Adjective',
  Adverb = 'Adverb',
  Phrase = 'Phrase',
  Other = 'Other'
}

export const LESSON_STEPS: readonly LessonStep[] = [
  LessonStep.Vocabulary,
  LessonStep.Grammar,
  LessonStep.Practice,
  LessonStep.Reading,
  LessonStep.Writing
];