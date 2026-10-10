import { WritingReviewStatus } from '../../domain/enums/practice.enums';

export interface WritingCheck {
  label: string;
  met: boolean;
}

export interface WritingSubmission {
  id: string;
  text: string;
  wordCount: number;
  scorePercent: number;
  passed: boolean;
  checks: WritingCheck[];
  sampleAnswer: string;
  reviewStatus: WritingReviewStatus;
  teacherFeedback: string | null;
  teacherScorePercent: number | null;
  submittedAtUtc: string;
}

export interface WritingTask {
  id: string;
  order: number;
  title: string;
  prompt: string;
  minWords: number;
  passPercent: number;
  latest: WritingSubmission | null;
}