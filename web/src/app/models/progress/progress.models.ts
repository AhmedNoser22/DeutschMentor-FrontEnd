import { PlanItemKind } from '../../domain/enums/progress.enums';
import { CefrLevel } from '../../domain/enums/user.enums';
import { ReviewSummary } from '../review/review.models';

export interface Streak {
  current: number;
  longest: number;
  studiedToday: boolean;
}

export interface WeekDay {
  date: string;
  active: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface ContinueLesson {
  lessonId: string;
  code: string;
  levelCode: CefrLevel;
  moduleOrder: number;
  unitOrder: number;
  title: string;
  titleEn: string;
  titleAr: string;
  stepsDone: number;
  totalSteps: number;
  minutesLeft: number;
}

export interface PlanItem {
  kind: PlanItemKind;
  title: string;
  minutes: number;
  done: boolean;
  lessonId: string | null;
}

export interface DailyPlan {
  items: PlanItem[];
  doneCount: number;
  minutesLeft: number;
}

export interface MentorMessage {
  title: string;
  body: string;
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAtUtc: string | null;
  detail: string | null;
  current: number;
  target: number;
}

export interface Today {
  streak: Streak;
  week: WeekDay[];
  continue: ContinueLesson | null;
  plan: DailyPlan;
  review: ReviewSummary;
  mentor: MentorMessage[];
  recentAchievements: Achievement[];
  serverNowUtc: string;
}