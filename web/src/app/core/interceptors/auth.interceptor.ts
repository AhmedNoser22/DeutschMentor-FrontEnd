import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { APP_SETTINGS } from '../config/app-settings';
import { AuthStore } from '../../state/auth/auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(AuthStore);
  const router = inject(Router);

  const isApiCall = req.url.startsWith(APP_SETTINGS.apiBaseUrl);
  const isAuthCall = req.url.includes('/api/auth/');
  if (!isApiCall || isAuthCall) {
    return next(req);
  }

  const withToken = (request: HttpRequest<unknown>, token: string | null) =>
    token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(withToken(req, store.accessToken())).pipe(
    catchError((error: unknown) => {
      const expired = error instanceof HttpErrorResponse && error.status === 401;
      if (!expired || !store.refreshToken()) {
        return throwError(() => error);
      }

      return store.refreshSession().pipe(
        catchError((refreshError: unknown) => {
          if (refreshError instanceof HttpErrorResponse && refreshError.status === 401) {
            store.clearSession();
            void router.navigate(['/auth/sign-in']);
          }
          return throwError(() => refreshError);
        }),
        switchMap((token) => next(withToken(req, token)))
      );
    })
  );
};