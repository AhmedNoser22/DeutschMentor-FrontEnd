import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'dm-password-field',
  imports: [IconComponent],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PasswordFieldComponent), multi: true }],
  template: `
    <div class="wrap">
      <input
        class="input"
        [attr.id]="inputId() || null"
        [type]="visible() ? 'text' : 'password'"
        [attr.autocomplete]="autocomplete()"
        [placeholder]="placeholder()"
        [class.invalid]="invalid()"
        [value]="value()"
        [disabled]="disabled()"
        (input)="onInput($event)"
        (blur)="touch()"
      />
      <button
        type="button"
        class="toggle"
        [attr.aria-label]="visible() ? 'Hide password' : 'Show password'"
        [attr.aria-pressed]="visible()"
        (click)="visible.set(!visible())"
      >
        <dm-icon [name]="visible() ? 'eye-off' : 'eye'" />
      </button>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .wrap { position: relative; }
      .wrap .input { padding-inline-end: 3.1rem; }
      .toggle {
        position: absolute;
        top: 50%;
        inset-inline-end: 0.3rem;
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        color: var(--muted);
        background: transparent;
        border: 0;
        border-radius: 8px;
        transform: translateY(-50%);
        cursor: pointer;
      }
      .toggle:hover { color: var(--ink); }
      .toggle dm-icon { width: 1.3rem; height: 1.3rem; }
    `
  ]
})
export class PasswordFieldComponent implements ControlValueAccessor {
  readonly inputId = input('');
  readonly autocomplete = input('current-password');
  readonly placeholder = input('');
  readonly invalid = input(false);

  protected readonly visible = signal(false);
  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.value.set(text);
    this.onChange(text);
  }

  protected touch(): void {
    this.onTouched();
  }
}