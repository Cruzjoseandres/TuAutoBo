import {
  Component,
  forwardRef,
  input,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <div class="space-y-1.5 w-full text-left">
      @if (label()) {
        <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          {{ label() }}
          @if (required()) {
            <span class="text-rose-500 font-bold ml-0.5">*</span>
          }
        </label>
      }

      <div class="relative flex items-center">
        <!-- Prefijo Fijo No Borrable (ej. +591) -->
        @if (prefixText()) {
          <div class="absolute left-3.5 flex items-center space-x-2 pointer-events-none select-none text-neutral-400 dark:text-neutral-400 font-semibold text-xs z-10">
            <span>{{ prefixText() }}</span>
            <span class="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700"></span>
          </div>
        }

        <input
          [type]="type()"
          [value]="innerValue()"
          (input)="onInputChange($event)"
          (blur)="onBlur()"
          [disabled]="disabled()"
          [placeholder]="placeholder()"
          [required]="required()"
          [attr.inputmode]="inputmode()"
          [attr.maxlength]="maxlength() ?? null"
          [class.pl-16]="!!prefixText()"
          [class.pr-14]="!!suffixText()"
          [class.!border-rose-500]="!!error()"
          [class.focus:!ring-rose-500/30]="!!error()"
          [class.bg-rose-500/[0.02]]="!!error()"
          class="w-full px-3.5 py-2.5 rounded-xl apple-input text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <!-- Sufijo Fijo (ej. BOB, kg, USD) -->
        @if (suffixText()) {
          <div class="absolute right-3.5 flex items-center space-x-2 pointer-events-none select-none text-neutral-400 dark:text-neutral-400 font-semibold text-xs z-10">
            <span class="h-4 w-[1px] bg-neutral-300 dark:bg-neutral-700"></span>
            <span>{{ suffixText() }}</span>
          </div>
        }
      </div>

      <!-- Mensaje de Error por Campo -->
      @if (error()) {
        <p class="text-[11px] text-rose-500 dark:text-rose-400 font-medium flex items-center space-x-1.5 pt-0.5">
          <svg class="w-3.5 h-3.5 flex-shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span>{{ error() }}</span>
        </p>
      } @else if (hint()) {
        <p class="text-[11px] text-neutral-500 dark:text-neutral-400">{{ hint() }}</p>
      }
    </div>
  `
})
export class InputComponent implements ControlValueAccessor {
  label = input<string>('');
  type = input<string>('text');
  placeholder = input<string>('');
  prefixText = input<string>('');
  suffixText = input<string>('');
  error = input<string>('');
  hint = input<string>('');
  required = input<boolean>(false);
  disabled = input<boolean>(false);
  inputmode = input<string>('text');
  maxlength = input<number | undefined>(undefined);

  innerValue = signal<any>('');

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.innerValue.set(val ?? '');
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.innerValue.set(target.value);
    this.onChange(target.value);
  }

  onBlur() {
    this.onTouched();
  }
}

