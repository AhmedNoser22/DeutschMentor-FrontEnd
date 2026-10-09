import { CefrLevel } from '../../domain/enums/user.enums';

export interface GrammarTable {
  headers: string[];
  rows: string[][];
  highlightColumns: number[];
}

export interface GrammarContent {
  table: GrammarTable | null;
  noteEn: string | null;
  noteAr: string | null;
}

export interface GrammarTopic {
  id: string;
  lessonId: string;
  level: CefrLevel;
  title: string;
  summary: string;
  content: GrammarContent;
}

export interface GrammarSummary {
  id: string;
  lessonId: string;
  level: CefrLevel;
  lessonTitle: string;
  title: string;
  summary: string;
}

export interface GrammarQuery {
  search?: string;
  level?: CefrLevel | '';
  page?: number;
  pageSize?: number;
}