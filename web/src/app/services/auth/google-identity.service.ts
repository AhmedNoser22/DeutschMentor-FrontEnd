import { Injectable } from '@angular/core';
import { GoogleAccounts } from '../../core/models/google-identity.model';

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private loading?: Promise<GoogleAccounts>;

  load(): Promise<GoogleAccounts> {
    this.loading ??= new Promise<GoogleAccounts>((resolve, reject) => {
      if (window.google) {
        resolve(window.google);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () =>
        window.google ? resolve(window.google) : reject(new Error('Google script is missing.'));
      script.onerror = () => {
        this.loading = undefined;
        reject(new Error('Google script failed to load.'));
      };
      document.head.appendChild(script);
    });

    return this.loading;
  }
}