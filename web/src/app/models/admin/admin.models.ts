export interface AdminStats {
  learners: number;
  lessons: number;
  drafts: number;
  examsTaken: number;
}

export interface AdminLesson {
  id: string;
  code: string;
  title: string;
  level: string;
  status: 'Draft' | 'Published';
  createdAtUtc: string;
  words: number;
  grammar: number;
  exercises: number;
  reading: number;
  writing: number;
}

export interface AdminWriting {
  id: string;
  studentName: string;
  taskTitle: string;
  prompt: string;
  text: string;
  scorePercent: number;
  sampleAnswer: string;
  submittedAtUtc: string;
}

export interface ExamPoolRow {
  level: string;
  skill: string;
  count: number;
}

export interface ImportReport {
  errors: string[];
  warnings: string[];
  counts: Record<string, number>;
  imported: boolean;
}