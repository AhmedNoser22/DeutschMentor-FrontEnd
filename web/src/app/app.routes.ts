import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards/auth.guards';

const comingSoon = () =>
  import('./shared/components/coming-soon.component').then((m) => m.ComingSoonComponent);

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'sign-in' },
      { path: 'sign-in', loadComponent: () => import('./pages/auth/sign-in.page').then((m) => m.SignInPage) },
      { path: 'create-account', loadComponent: () => import('./pages/auth/create-account.page').then((m) => m.CreateAccountPage) },
      { path: 'confirm-email', loadComponent: () => import('./pages/auth/confirm-email.page').then((m) => m.ConfirmEmailPage) },
      { path: 'forgot-password', loadComponent: () => import('./pages/auth/forgot-password.page').then((m) => m.ForgotPasswordPage) },
      { path: 'reset-password', loadComponent: () => import('./pages/auth/reset-password.page').then((m) => m.ResetPasswordPage) }
    ]
  },
  { path: 'verify', loadComponent: () => import('./pages/certificates/verify.page').then((m) => m.VerifyPage) },
  { path: 'verify/:code', loadComponent: () => import('./pages/certificates/verify.page').then((m) => m.VerifyPage) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'today' },
      { path: 'today', loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage) },
      { path: 'profile', loadComponent: () => import('./pages/auth/profile.page').then((m) => m.ProfilePage) },

      { path: 'learn', loadComponent: () => import('./pages/learning/learn.page').then((m) => m.LearnPage) },
      { path: 'learn/lesson/:id', loadComponent: () => import('./pages/learning/lesson.page').then((m) => m.LessonPage) },

      { path: 'vocabulary', loadComponent: () => import('./pages/vocabulary/vocabulary-library.page').then((m) => m.VocabularyLibraryPage) },
      { path: 'vocabulary/flashcards', loadComponent: () => import('./pages/vocabulary/flashcards.page').then((m) => m.FlashcardsPage) },

      { path: 'grammar', loadComponent: () => import('./pages/grammar/grammar-library.page').then((m) => m.GrammarLibraryPage) },
      { path: 'grammar/:id', loadComponent: () => import('./pages/grammar/grammar-topic.page').then((m) => m.GrammarTopicPage) },

      { path: 'review', loadComponent: () => import('./pages/review/review.page').then((m) => m.ReviewPage) },
      { path: 'drills/articles', loadComponent: () => import('./pages/drills/article-drill.page').then((m) => m.ArticleDrillPage) },
      { path: 'achievements', loadComponent: () => import('./pages/progress/achievements.page').then((m) => m.AchievementsPage) },

      { path: 'exams', loadComponent: () => import('./pages/exams/exams.page').then((m) => m.ExamsPage) },
      { path: 'exams/take/:id', loadComponent: () => import('./pages/exams/exam-take.page').then((m) => m.ExamTakePage) },
      { path: 'exams/result/:id', loadComponent: () => import('./pages/exams/exam-result.page').then((m) => m.ExamResultPage) },

      { path: 'certificates', loadComponent: () => import('./pages/certificates/certificates.page').then((m) => m.CertificatesPage) },
      { path: 'admin/users', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/admin-users.page').then((m) => m.AdminUsersPage) },
      { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/admin.page').then((m) => m.AdminPage) }
    ]
  },
  { path: '**', redirectTo: '' }
];