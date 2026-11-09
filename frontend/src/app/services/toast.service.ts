import { Injectable, signal } from '@angular/core';

export interface ToastMensaje {
  id: string;
  tipo: 'exito' | 'error' | 'advertencia' | 'info';
  titulo: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts = signal<ToastMensaje[]>([]);

  mostrar(tipo: 'exito' | 'error' | 'advertencia' | 'info', titulo: string, descripcion?: string) {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nuevo: ToastMensaje = { id, tipo, titulo, descripcion };
    this.toasts.update((actuales) => [...actuales, nuevo]);

    setTimeout(() => {
      this.remover(id);
    }, 4000);
  }

  exito(titulo: string, descripcion?: string) {
    this.mostrar('exito', titulo, descripcion);
  }

  error(titulo: string, descripcion?: string) {
    this.mostrar('error', titulo, descripcion);
  }

  advertencia(titulo: string, descripcion?: string) {
    this.mostrar('advertencia', titulo, descripcion);
  }

  info(titulo: string, descripcion?: string) {
    this.mostrar('info', titulo, descripcion);
  }

  remover(id: string) {
    this.toasts.update((actuales) => actuales.filter((t) => t.id !== id));
  }
}
