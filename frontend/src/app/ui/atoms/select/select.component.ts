import {
  Component,
  ElementRef,
  HostListener,
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

export interface SelectOption {
  value: any;
  label: string;
  hint?: string;
  icon?: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="space-y-1.5 w-full text-left relative select-none">
      @if (label()) {
        <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          {{ label() }}
          @if (required()) {
            <span class="text-rose-500 font-bold ml-0.5">*</span>
          }
        </label>
      }

      <!-- Gatillo del Selector (Estilo Apple Input) -->
      <button
        type="button"
        (click)="toggle()"
        [disabled]="disabled()"
        [class.border-rose-500]="!!error()"
        [class.focus:ring-rose-500]="!!error()"
        class="w-full px-3.5 py-2.5 rounded-xl apple-input text-xs flex items-center justify-between text-left transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#0071E3] disabled:opacity-50 disabled:cursor-not-allowed">
        <span 
          class="truncate font-medium"
          [ngClass]="selectedOption() ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'">
          {{ selectedLabel() }}
        </span>

        <svg
          class="w-4 h-4 text-neutral-400 transition-transform duration-200 flex-shrink-0 ml-2"
          [class.rotate-180]="isOpen()"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <!-- Menú Popover Desplegable Apple Glassmorphism (Sin select nativo) -->
      @if (isOpen()) {
        <div class="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto p-1.5 rounded-2xl bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-2xl space-y-0.5 animate-scale-pop">
          @for (opt of options(); track opt.value) {
            <button
              type="button"
              (click)="select(opt)"
              [ngClass]="isSelected(opt)
                ? 'bg-[#0071E3] text-white'
                : 'text-neutral-900 dark:text-neutral-100 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'"
              class="w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors">
              <div class="flex flex-col pr-2 truncate">
                <span class="truncate font-semibold">{{ opt.label }}</span>
                @if (opt.hint) {
                  <span 
                    class="text-[10px] truncate"
                    [ngClass]="isSelected(opt) ? 'text-blue-100' : 'text-neutral-500 dark:text-neutral-400'">
                    {{ opt.hint }}
                  </span>
                }
              </div>

              @if (isSelected(opt)) {
                <svg class="w-4 h-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              }
            </button>
          }
        </div>
      }

      <!-- Mensaje de Error -->
      @if (error()) {
        <p class="text-[11px] text-rose-500 dark:text-rose-400 font-medium flex items-center space-x-1">
          <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{{ error() }}</span>
        </p>
      }
    </div>
  `,
  styles: [`
    @keyframes scalePop {
      from {
        opacity: 0;
        transform: scale(0.97) translateY(-4px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    .animate-scale-pop {
      animation: scalePop 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class SelectComponent implements ControlValueAccessor {
  label = input<string>('');
  placeholder = input<string>('Seleccionar opción...');
  options = input<SelectOption[]>([]);
  required = input<boolean>(false);
  disabled = input<boolean>(false);
  error = input<string>('');

  isOpen = signal<boolean>(false);
  currentValue = signal<any>(null);

  constructor(private elementRef: ElementRef) {}

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('keydown.escape')
  onEscape() {
    this.isOpen.set(false);
  }

  writeValue(val: any): void {
    this.currentValue.set(val);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  toggle() {
    if (!this.disabled()) {
      this.isOpen.set(!this.isOpen());
    }
  }

  select(option: SelectOption) {
    this.currentValue.set(option.value);
    this.onChange(option.value);
    this.onTouched();
    this.isOpen.set(false);
  }

  isSelected(option: SelectOption): boolean {
    return this.currentValue() === option.value;
  }

  selectedOption(): SelectOption | undefined {
    return this.options().find((o) => o.value === this.currentValue());
  }

  selectedLabel(): string {
    const opt = this.selectedOption();
    return opt ? opt.label : this.placeholder();
  }
}

