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
import { IconComponent, IconName } from '../../atoms/icon/icon.component';

export interface SegmentOption {
  value: any;
  label: string;
  icon?: IconName;
  badge?: string;
}

@Component({
  selector: 'app-segmented-control',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegmentedControlComponent),
      multi: true
    }
  ],
  template: `
    <div class="space-y-1.5 w-full text-left select-none">
      @if (label()) {
        <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          {{ label() }}
        </label>
      }

      <div class="p-1 rounded-2xl bg-black/[0.05] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.08] flex items-center gap-1 w-full">
        @for (opt of options(); track opt.value) {
          <button
            type="button"
            (click)="select(opt)"
            [disabled]="disabled()"
            [class.bg-white]="isSelected(opt)"
            [class.dark:bg-[#1C1C1E]]="isSelected(opt)"
            [class.text-neutral-900]="isSelected(opt)"
            [class.dark:text-white]="isSelected(opt)"
            [class.shadow-sm]="isSelected(opt)"
            [class.font-bold]="isSelected(opt)"
            [class.text-neutral-600]="!isSelected(opt)"
            [class.dark:text-neutral-400]="!isSelected(opt)"
            [class.font-medium]="!isSelected(opt)"
            [class.hover:text-neutral-900]="!isSelected(opt)"
            [class.dark:hover:text-white]="!isSelected(opt)"
            class="flex-1 py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all duration-150 active:scale-[0.98] disabled:opacity-50">
            @if (opt.icon) {
              <app-icon [name]="opt.icon" size="sm"></app-icon>
            }
            <span class="truncate">{{ opt.label }}</span>
            @if (opt.badge) {
              <span class="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/15 text-[#0071E3] font-bold">
                {{ opt.badge }}
              </span>
            }
          </button>
        }
      </div>
    </div>
  `
})
export class SegmentedControlComponent implements ControlValueAccessor {
  label = input<string>('');
  options = input<SegmentOption[]>([]);
  disabled = input<boolean>(false);

  currentValue = signal<any>(null);

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.currentValue.set(val);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  select(option: SegmentOption) {
    if (!this.disabled()) {
      this.currentValue.set(option.value);
      this.onChange(option.value);
      this.onTouched();
    }
  }

  isSelected(option: SegmentOption): boolean {
    return this.currentValue() === option.value;
  }
}

