import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="computedClasses()">
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {
  padding = input<CardPadding>('md');
  hoverable = input<boolean>(false);
  customClass = input<string>('');

  computedClasses = computed(() => {
    const base = 'apple-card rounded-3xl transition-all duration-200';
    
    const paddingMap: Record<CardPadding, string> = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    const hoverClass = this.hoverable() 
      ? 'hover:shadow-xl hover:border-black/[0.1] dark:hover:border-white/[0.16] cursor-pointer' 
      : 'shadow-lg';

    return `${base} ${paddingMap[this.padding()]} ${hoverClass} ${this.customClass()}`.trim();
  });
}
