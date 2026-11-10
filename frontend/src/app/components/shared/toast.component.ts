import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastMensaje, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4">
      @for (t of toastService.toasts(); track t.id) {
        <div 
          (click)="alHacerClicToast(t)"
          class="pointer-events-auto p-4 rounded-2xl backdrop-blur-2xl border shadow-xl flex items-start space-x-3 transition-all duration-300 animate-slide-in"
          [class.cursor-pointer]="!!t.rutaDestino"
          [class.hover:scale-[1.01]]="!!t.rutaDestino"
          [ngClass]="{
            'bg-white/95 dark:bg-[#1C1C1E]/95 text-neutral-900 dark:text-neutral-100 border-black/[0.08] dark:border-white/[0.12]': t.tipo === 'info',
            'bg-emerald-500/95 text-white border-emerald-400/40 shadow-emerald-500/20': t.tipo === 'exito',
            'bg-rose-500/95 text-white border-rose-400/40 shadow-rose-500/20': t.tipo === 'error',
            'bg-amber-500/95 text-white border-amber-400/40 shadow-amber-500/20': t.tipo === 'advertencia'
          }">
          
          <div class="flex-shrink-0 mt-0.5">
            @if (t.tipo === 'exito') {
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            } @else if (t.tipo === 'error') {
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            } @else if (t.tipo === 'advertencia') {
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            } @else {
              <svg class="w-4 h-4 text-[#0071E3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            }
          </div>

          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-bold leading-tight">{{ t.titulo }}</h4>
            @if (t.descripcion) {
              <p class="text-[11px] opacity-90 mt-0.5 leading-snug line-clamp-2">{{ t.descripcion }}</p>
            }
            @if (t.rutaDestino) {
              <div class="mt-2 inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-black/10 dark:bg-white/15">
                <span>{{ t.textoAccion || 'Ir a ver ahora' }}</span>
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            }
          </div>

          <button 
            (click)="cerrarSinNavegar($event, t.id)"
            class="text-current opacity-60 hover:opacity-100 transition-opacity p-0.5">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-8px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    .animate-slide-in {
      animation: slideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `],
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  alHacerClicToast(t: ToastMensaje): void {
    if (t.rutaDestino && t.rutaDestino.length > 0) {
      this.router.navigate(t.rutaDestino, { queryParams: t.queryParams });
      this.toastService.remover(t.id);
    }
  }

  cerrarSinNavegar(event: Event, id: string): void {
    event.stopPropagation();
    this.toastService.remover(id);
  }
}
