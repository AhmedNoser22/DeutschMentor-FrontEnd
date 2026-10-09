import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../state/auth/auth.store';

export const authGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  return store.isAuthenticated() ? true : inject(Router).createUrlTree(['/auth/sign-in']);
};

export const guestGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  return store.isAuthenticated() ? inject(Router).createUrlTree(['/today']) : true;
};

export const adminGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  return store.isAdmin() ? true : inject(Router).createUrlTree(['/today']);
};