import { Article, PartOfSpeech } from '../../domain/enums/learning.enums';
import { CefrLevel } from '../../domain/enums/user.enums';

export interface VocabularyItem {
  id: string;
  lessonId: string;
  level: CefrLevel;
  german: string;
  article: Article | null;
  partOfSpeech: PartOfSpeech;
  english: string;
  arabic: string;
  exampleGerman: string;
  exampleEnglish: string;
  inReview: boolean;
}

export interface VocabularyQuery {
  search?: string;
  level?: CefrLevel | '';
  partOfSpeech?: PartOfSpeech | '';
  article?: Article | '';
  page?: number;
  pageSize?: number;
}