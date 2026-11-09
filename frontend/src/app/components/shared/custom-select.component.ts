import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  valor: any;
  etiqueta: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-block text-left select-none">
      <button
        type="button"
        (click)="abierto.set(!abierto())"
        class="active:scale-[0.98] transition-all duration-150 inline-flex items-center justify-between space-x-2 px-3 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.07] dark:hover:bg-white/[0.12] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-sm focus:outline-none">
        <span>{{ etiquetaSeleccionada() }}</span>
        <svg 
          class="w-3.5 h-3.5 text-neutral-500 transition-transform duration-200" 
          [class.rotate-180]="abierto()" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      @if (abierto()) {
        <!-- Backdrop para cerrar al hacer clic afuera -->
        <div class="fixed inset-0 z-40" (click)="abierto.set(false)"></div>

        <!-- Menú Popover Apple Glass -->
        <div class="absolute right-0 z-50 mt-1.5 min-w-[160px] p-1 rounded-2xl bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-2xl space-y-0.5 animate-scale-pop">
          @for (opcion of opciones; track opcion.valor) {
            <button
              type="button"
              (click)="seleccionar(opcion)"
              [class.bg-[#0071E3]]="valorSeleccionado === opcion.valor"
              [class.text-white]="valorSeleccionado === opcion.valor"
              [class.text-neutral-800]="valorSeleccionado !== opcion.valor"
              [class.dark:text-neutral-200]="valorSeleccionado !== opcion.valor"
              [class.hover:bg-black/[0.05]]="valorSeleccionado !== opcion.valor"
              [class.dark:hover:bg-white/[0.08]]="valorSeleccionado !== opcion.valor"
              class="w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors">
              <span>{{ opcion.etiqueta }}</span>
              @if (valorSeleccionado === opcion.valor) {
                <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes scalePop {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-4px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    .animate-scale-pop {
      animation: scalePop 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `],
})
export class CustomSelectComponent {
  @Input() opciones: SelectOption[] = [];
  @Input() valorSeleccionado: any;
  @Output() valorSeleccionadoChange = new EventEmitter<any>();

  abierto = signal<boolean>(false);

  etiquetaSeleccionada(): string {
    const encontrada = this.opciones.find((o) => o.valor === this.valorSeleccionado);
    return encontrada ? encontrada.etiqueta : 'Seleccionar...';
  }

  seleccionar(opcion: SelectOption) {
    this.valorSeleccionado = opcion.valor;
    this.valorSeleccionadoChange.emit(opcion.valor);
    this.abierto.set(false);
  }
}
