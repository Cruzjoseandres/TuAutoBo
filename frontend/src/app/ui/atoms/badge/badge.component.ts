import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'escrow'
  | 'neutral';

export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="computedClasses()">
      @if (dot()) {
        <span class="w-1.5 h-1.5 rounded-full mr-1.5" [class]="dotClass()"></span>
      }
      <ng-content></ng-content>
    </span>
  `
})
export class BadgeComponent {
  variant = input<BadgeVariant>('neutral');
  size = input<BadgeSize>('md');
  dot = input<boolean>(false);
  customClass = input<string>('');

  computedClasses = computed(() => {
    const base = 'inline-flex items-center font-semibold rounded-full border transition-colors select-none';
    
    const sizeMap: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-[10px]',
      md: 'px-2.5 py-1 text-xs'
    };

    const variantMap: Record<BadgeVariant, string> = {
      primary: 'bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20 dark:bg-[#0071E3]/20 dark:text-[#3894F8]',
      success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 dark:bg-emerald-500/20',
      warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 dark:bg-amber-500/20',
      danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 dark:bg-rose-500/20',
      escrow: 'bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-500/20 dark:bg-blue-600/20',
      neutral: 'bg-black/[0.04] text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300 border-black/[0.08] dark:border-white/[0.1]'
    };

    return `${base} ${sizeMap[this.size()]} ${variantMap[this.variant()]} ${this.customClass()}`.trim();
  });

  dotClass = computed(() => {
    const dotMap: Record<BadgeVariant, string> = {
      primary: 'bg-[#0071E3]',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-rose-500',
      escrow: 'bg-blue-500 animate-pulse',
      neutral: 'bg-neutral-400 dark:bg-neutral-500'
    };
    return dotMap[this.variant()];
  });
}
