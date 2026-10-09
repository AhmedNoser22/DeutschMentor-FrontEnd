export interface GoogleCredentialResponse {
  credential: string;
}

export interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  ux_mode?: 'popup';
}

export interface GoogleButtonOptions {
  type: 'standard';
  theme: 'outline' | 'filled_black';
  size: 'large';
  text: 'signin_with' | 'signup_with' | 'continue_with';
  shape: 'rectangular';
  width: number;
}

export interface GoogleAccounts {
  accounts: {
    id: {
      initialize(config: GoogleIdConfiguration): void;
      renderButton(element: HTMLElement, options: GoogleButtonOptions): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}