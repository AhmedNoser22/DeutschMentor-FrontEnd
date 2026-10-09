import { AfterViewInit, Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { ThemeService } from '../../core/services/theme.service';
import { GoogleIdentityService } from '../../services/auth/google-identity.service';

@Component({
  selector: 'dm-google-button',
  template: `
    <div #host class="host"></div>
    @if (unavailable()) {
      <p class="muted note">Google sign-in is unavailable right now.</p>
    }
  `,
  styles: [
    `
      .host { display: flex; justify-content: center; min-height: 44px; }
      .note { text-align: center; font-size: 0.9rem; }
    `
  ]
})
export class GoogleButtonComponent implements AfterViewInit {
  private readonly google = inject(GoogleIdentityService);
  private readonly theme = inject(ThemeService);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');

  readonly text = input<'signin_with' | 'signup_with' | 'continue_with'>('continue_with');
  readonly credential = output<string>();
  protected readonly unavailable = signal(false);

  ngAfterViewInit(): void {
    void this.render();
  }

  private async render(): Promise<void> {
    try {
      const accounts = await this.google.load();
      const element = this.host().nativeElement;

      accounts.accounts.id.initialize({
        client_id: APP_SETTINGS.googleClientId,
        callback: (response) => this.credential.emit(response.credential),
        ux_mode: 'popup'
      });

      accounts.accounts.id.renderButton(element, {
        type: 'standard',
        theme: this.theme.theme() === 'dark' ? 'filled_black' : 'outline',
        size: 'large',
        text: this.text(),
        shape: 'rectangular',
        width: Math.min(element.clientWidth || 320, 400)
      });
    } catch {
      this.unavailable.set(true);
    }
  }
}