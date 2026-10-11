import { Article, PartOfSpeech } from '../../domain/enums/learning.enums';

export interface ReviewIntervals {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

export interface ReviewCard {
  reviewItemId: string;
  vocabularyItemId: string;
  german: string;
  article: Article | null;
  partOfSpeech: PartOfSpeech;
  english: string;
  arabic: string;
  exampleGerman: string;
  exampleEnglish: string;
  isNew: boolean;
  intervals: ReviewIntervals;
}

export interface ReviewQueue {
  cards: ReviewCard[];
  totalDue: number;
  serverNowUtc: string;
}

export interface ReviewSummary {
  dueCount: number;
  estimatedMinutes: number;
}

export interface RateReviewResult {
  intervalDays: number;
  dueAtUtc: string;
  dueRemaining: number;
}