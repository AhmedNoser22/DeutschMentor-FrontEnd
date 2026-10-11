import { Article } from '../../domain/enums/learning.enums';

export interface ArticleDrillQuestion {
  vocabularyItemId: string;
  german: string;
  english: string;
  arabic: string;
}

export interface ArticleDrill {
  questions: ArticleDrillQuestion[];
}

export interface ArticleAnswerResult {
  correct: boolean;
  correctArticle: Article;
  german: string;
  exampleGerman: string;
  exampleEnglish: string;
}