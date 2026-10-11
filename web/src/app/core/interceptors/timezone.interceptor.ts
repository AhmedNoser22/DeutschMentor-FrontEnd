import { HttpInterceptorFn } from '@angular/common/http';
import { APP_SETTINGS } from '../config/app-settings';

export const timezoneInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(APP_SETTINGS.apiBaseUrl)) {
    return next(req);
  }

  const offsetMinutes = -new Date().getTimezoneOffset();
  return next(req.clone({ setHeaders: { 'X-Timezone-Offset': String(offsetMinutes) } }));
};