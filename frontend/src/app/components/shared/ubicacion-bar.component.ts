import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UbicacionService } from '../../services/ubicacion.service';

@Component({
  selector: 'app-ubicacion-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Barra Píldora Ubicación Estilo PedidosYa en el Header -->
    <div class="inline-flex items-center">
      <button
        type="button"
        (click)="abrirModal()"
        title="Cambiar dirección de entrega en Santa Cruz"
        class="active:scale-[0.98] transition-all duration-150 inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] border border-black/[0.06] dark:border-white/[0.1] text-xs text-neutral-800 dark:text-neutral-200 shadow-sm focus:outline-none">
        <svg class="w-3.5 h-3.5 text-[#0071E3] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        @if (ubicacionService.ubicacionActiva(); as activa) {
          <span class="font-medium text-neutral-500 dark:text-neutral-400">Entregar en:</span>
          <span class="font-bold truncate max-w-[170px] sm:max-w-[220px] text-neutral-900 dark:text-white">
            {{ activa.alias }}
          </span>
        } @else {
          <span class="font-medium text-[#0071E3] flex items-center space-x-1">
            <span>Agregar dirección de entrega</span>
          </span>
        }
        <svg class="w-3 h-3 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
    </div>
  `,
})
export class UbicacionBarComponent {
  protected readonly ubicacionService = inject(UbicacionService);

  abrirModal() {
    this.ubicacionService.modalSelectorAbierto.set(true);
  }
}
