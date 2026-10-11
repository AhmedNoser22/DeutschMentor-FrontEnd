export enum ExamAvailability {
  Passed = 'Passed',
  Ready = 'Ready',
  InProgress = 'InProgress',
  Cooldown = 'Cooldown',
  LessonsRemaining = 'LessonsRemaining',
  LevelLocked = 'LevelLocked',
  NotPublished = 'NotPublished'
}

export enum ExamKind {
  Level = 'Level',
  Placement = 'Placement'
}

export enum ExamAttemptStatus {
  InProgress = 'InProgress',
  Submitted = 'Submitted',
  Expired = 'Expired'
}

export enum ExerciseSkill {
  Vocabulary = 'Vocabulary',
  Grammar = 'Grammar',
  Reading = 'Reading',
  Writing = 'Writing'
}