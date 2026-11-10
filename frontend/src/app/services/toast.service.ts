import { Injectable, signal } from '@angular/core';

export interface ToastMensaje {
  id: string;
  tipo: 'exito' | 'error' | 'advertencia' | 'info';
  titulo: string;
  descripcion?: string;
  rutaDestino?: string[];
  queryParams?: Record<string, string>;
  textoAccion?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts = signal<ToastMensaje[]>([]);

  mostrar(
    tipo: 'exito' | 'error' | 'advertencia' | 'info',
    titulo: string,
    descripcion?: string,
    opciones?: { rutaDestino?: string[]; queryParams?: Record<string, string>; textoAccion?: string; duracionMs?: number }
  ) {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nuevo: ToastMensaje = {
      id,
      tipo,
      titulo,
      descripcion,
      rutaDestino: opciones?.rutaDestino,
      queryParams: opciones?.queryParams,
      textoAccion: opciones?.textoAccion,
    };
    this.toasts.update((actuales) => [...actuales, nuevo]);

    setTimeout(() => {
      this.remover(id);
    }, opciones?.duracionMs ?? (opciones?.rutaDestino ? 6000 : 4000));
  }

  exito(
    titulo: string,
    descripcion?: string,
    opciones?: { rutaDestino?: string[]; queryParams?: Record<string, string>; textoAccion?: string; duracionMs?: number }
  ) {
    this.mostrar('exito', titulo, descripcion, opciones);
  }

  error(
    titulo: string,
    descripcion?: string,
    opciones?: { rutaDestino?: string[]; queryParams?: Record<string, string>; textoAccion?: string; duracionMs?: number }
  ) {
    this.mostrar('error', titulo, descripcion, opciones);
  }

  advertencia(
    titulo: string,
    descripcion?: string,
    opciones?: { rutaDestino?: string[]; queryParams?: Record<string, string>; textoAccion?: string; duracionMs?: number }
  ) {
    this.mostrar('advertencia', titulo, descripcion, opciones);
  }

  info(
    titulo: string,
    descripcion?: string,
    opciones?: { rutaDestino?: string[]; queryParams?: Record<string, string>; textoAccion?: string; duracionMs?: number }
  ) {
    this.mostrar('info', titulo, descripcion, opciones);
  }

  remover(id: string) {
    this.toasts.update((actuales) => actuales.filter((t) => t.id !== id));
  }
}
