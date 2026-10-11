import {
  ExamAttemptStatus,
  ExamAvailability,
  ExamKind,
  ExerciseSkill
} from '../../domain/enums/exam.enums';
import { CefrLevel } from '../../domain/enums/user.enums';
import { ExerciseItem } from '../exercises/exercise.models';

export interface ExamLevelRow {
  code: CefrLevel;
  title: string;
  availability: ExamAvailability;
  lessonsRemaining: number;
  opensAfterLevelCode: CefrLevel | null;
  passMarkPercent: number;
  passedScorePercent: number | null;
  passedAtUtc: string | null;
  retakeAvailableAtUtc: string | null;
  inProgressAttemptId: string | null;
  certificateId: string | null;
  passedByPlacement: boolean;
}

export interface PlacementInfo {
  available: boolean;
  inProgressAttemptId: string | null;
  questionCount: number;
  minutes: number;
}

export interface ExamOverview {
  levels: ExamLevelRow[];
  placement: PlacementInfo;
  passMarkPercent: number;
  retakeCooldownHours: number;
  serverNowUtc: string;
}

export interface ExamQuestion {
  exercise: ExerciseItem;
  skill: ExerciseSkill;
}

export interface SavedAnswer {
  questionId: string;
  answer: string[];
  flagged: boolean;
}

export interface ExamSession {
  attemptId: string;
  kind: ExamKind;
  levelCode: CefrLevel | null;
  title: string;
  status: ExamAttemptStatus;
  startedAtUtc: string;
  expiresAtUtc: string;
  serverNowUtc: string;
  questions: ExamQuestion[];
  answers: SavedAnswer[];
}

export interface ExamAnswerInput {
  questionId: string;
  answer: string[];
  flagged: boolean;
}

export interface ScoreBreakdown {
  label: string;
  correct: number;
  total: number;
  percent: number;
}

export interface ExamResult {
  attemptId: string;
  kind: ExamKind;
  levelCode: CefrLevel | null;
  title: string;
  status: ExamAttemptStatus;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  passMarkPercent: number;
  passed: boolean;
  breakdown: ScoreBreakdown[];
  weakAreas: string[];
  submittedAtUtc: string;
  retakeAvailableAtUtc: string | null;
  serverNowUtc: string;
  certificateId: string | null;
  nextLevelCode: CefrLevel | null;
  placedLevelCode: CefrLevel | null;
}