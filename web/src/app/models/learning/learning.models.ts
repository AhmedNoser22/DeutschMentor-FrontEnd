import { ExamState, LessonState, LessonStep, LevelStatus } from '../../domain/enums/learning.enums';
import { CefrLevel } from '../../domain/enums/user.enums';

export interface LevelSummary {
  code: CefrLevel;
  title: string;
  description: string;
  status: LevelStatus;
  totalLessons: number;
  completedLessons: number;
  passedScorePercent: number | null;
}

export interface LevelRequirements {
  previousLevelCode: CefrLevel;
  previousTotalLessons: number;
  previousCompletedLessons: number;
  previousExamPassed: boolean;
}

export interface LevelExam {
  state: ExamState;
  lessonsRemaining: number;
  passMarkPercent: number;
  nextLevelCode: CefrLevel | null;
}

export interface LessonSummary {
  id: string;
  code: string;
  title: string;
  titleEn: string;
  estimatedMinutes: number;
  state: LessonState;
}

export interface PathUnit {
  id: string;
  order: number;
  title: string;
  lessons: LessonSummary[];
}

export interface PathModule {
  id: string;
  order: number;
  title: string;
  titleEn: string;
  totalLessons: number;
  completedLessons: number;
  units: PathUnit[];
}

export interface LevelDetail {
  summary: LevelSummary;
  requirements: LevelRequirements | null;
  exam: LevelExam;
  modules: PathModule[];
}

export interface LessonDetail {
  id: string;
  code: string;
  levelCode: CefrLevel;
  moduleOrder: number;
  unitOrder: number;
  lessonOrder: number;
  title: string;
  titleEn: string;
  titleAr: string;
  estimatedMinutes: number;
  stepsSeen: LessonStep[];
  isCompleted: boolean;
}

export interface LessonProgress {
  stepsSeen: LessonStep[];
  isCompleted: boolean;
  canFinish: boolean;
}

export interface FinishLessonResponse {
  nextLessonId: string | null;
  levelReadyForExam: boolean;
}