import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../atoms/icon/icon.component';
import { CardComponent } from '../../atoms/card/card.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, IconComponent, CardComponent],
  template: `
    <app-card padding="md" [customClass]="'space-y-3'">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
          {{ title() }}
        </span>
        @if (iconName()) {
          <div [class]="iconBgClasses()">
            <app-icon [name]="iconName()!" size="sm"></app-icon>
          </div>
        }
      </div>

      <div class="space-y-1">
        <div class="text-2xl font-extrabold tracking-tight" [class]="valueColorClasses()">
          {{ value() }}
        </div>
        @if (subtitle()) {
          <p class="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            {{ subtitle() }}
          </p>
        }
      </div>
    </app-card>
  `
})
export class StatCardComponent {
  title = input.required<string>();
  value = input.required<string | number>();
  subtitle = input<string>('');
  iconName = input<IconName | undefined>(undefined);
  variant = input<'primary' | 'success' | 'warning' | 'neutral'>('neutral');

  iconBgClasses = computed(() => {
    const map = {
      primary: 'w-7 h-7 rounded-xl bg-blue-500/15 text-[#0071E3] flex items-center justify-center',
      success: 'w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center',
      warning: 'w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center',
      neutral: 'w-7 h-7 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 flex items-center justify-center'
    };
    return map[this.variant()];
  });

  valueColorClasses = computed(() => {
    const map = {
      primary: 'text-[#0071E3]',
      success: 'text-emerald-600 dark:text-emerald-400',
      warning: 'text-amber-600 dark:text-amber-400',
      neutral: 'text-neutral-900 dark:text-white'
    };
    return map[this.variant()];
  });
}

