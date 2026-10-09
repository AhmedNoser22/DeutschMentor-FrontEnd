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

      { path: 'review', data: { title: 'Spaced review', phase: 'phase 9' }, loadComponent: comingSoon },
      { path: 'exams', data: { title: 'Exams', phase: 'phase 7' }, loadComponent: comingSoon },
      { path: 'certificates', data: { title: 'Certificates', phase: 'phase 8' }, loadComponent: comingSoon },
      { path: 'admin', canActivate: [adminGuard], data: { title: 'Admin', phase: 'phase 10' }, loadComponent: comingSoon }
    ]
  },
  { path: '**', redirectTo: '' }
];