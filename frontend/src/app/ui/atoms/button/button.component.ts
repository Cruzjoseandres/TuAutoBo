import { Component, input, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      (click)="onClick($event)"
      [class]="computedClasses()">
      @if (loading()) {
        <svg class="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      }
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  fullWidth = input<boolean>(false);
  customClass = input<string>('');

  clicked = output<MouseEvent>();

  computedClasses = computed(() => {
    const base = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 select-none active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/50 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 shadow-sm';

    const widthClass = this.fullWidth() ? 'w-full' : '';

    const sizeMap: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs space-x-1.5',
      md: 'px-4 py-2.5 text-xs space-x-2',
      lg: 'px-5 py-3 text-sm space-x-2'
    };

    const variantMap: Record<ButtonVariant, string> = {
      primary: 'bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-md active:bg-[#0060C0]',
      secondary: 'bg-neutral-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900',
      glass: 'bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-neutral-800 dark:text-neutral-200 border border-black/[0.08] dark:border-white/[0.1]',
      ghost: 'bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 border border-transparent shadow-none',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
    };

    return `${base} ${widthClass} ${sizeMap[this.size()]} ${variantMap[this.variant()]} ${this.customClass()}`.trim();
  });

  onClick(e: MouseEvent) {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(e);
    }
  }
}
