import { Injectable } from '@angular/core';
import { APP_SETTINGS } from '../config/app-settings';

@Injectable({ providedIn: 'root' })
export class StorageService {
  get(key: string): string | null {
    try {
      return localStorage.getItem(APP_SETTINGS.storagePrefix + key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(APP_SETTINGS.storagePrefix + key, value);
    } catch {
      return;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(APP_SETTINGS.storagePrefix + key);
    } catch {
      return;
    }
  }
}