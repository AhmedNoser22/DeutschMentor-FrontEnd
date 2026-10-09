import { environment } from '../../../environments/environment';
export const APP_SETTINGS = {
  apiBaseUrl: environment.apiBaseUrl,
  googleClientId: environment.googleClientId,
  storagePrefix: 'dm.'
} as const;