import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface DireccionComprador {
  id: string;
  alias: string;
  direccion_escrita: string;
  referencia?: string;
  latitud: number;
  longitud: number;
  es_predeterminada?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UbicacionService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  // Direcciones reales del comprador (sin datos mock)
  direcciones = signal<DireccionComprador[]>([]);
  ubicacionActiva = signal<DireccionComprador | null>(null);
  modalSelectorAbierto = signal<boolean>(false);

  constructor() {
    this.cargarDireccionesUsuario();
  }

  cargarDireccionesUsuario() {
    const user = this.auth.usuarioActual();
    if (!user) {
      this.direcciones.set([]);
      this.ubicacionActiva.set(null);
      return;
    }

    this.http.get<DireccionComprador[]>(`${this.apiUrl}/${user.id}/direcciones`).subscribe({
      next: (dirs) => {
        if (dirs && dirs.length > 0) {
          this.direcciones.set(dirs);
          const activa = dirs.find((d) => d.es_predeterminada) || dirs[0];
          this.ubicacionActiva.set(activa);
        } else {
          this.direcciones.set([]);
          this.ubicacionActiva.set(null);
        }
      },
      error: () => {
        this.direcciones.set([]);
        this.ubicacionActiva.set(null);
      },
    });
  }

  seleccionarUbicacion(dir: DireccionComprador) {
    this.ubicacionActiva.set(dir);
    this.modalSelectorAbierto.set(false);
  }

  agregarNuevaDireccion(dto: {
    alias: string;
    direccion_escrita: string;
    referencia?: string;
    latitud: number;
    longitud: number;
    es_predeterminada?: boolean;
  }): Observable<DireccionComprador[]> {
    const user = this.auth.usuarioActual();
    return this.http
      .post<DireccionComprador[]>(`${this.apiUrl}/${user?.id}/direcciones`, dto)
      .pipe(
        tap((nuevas) => {
          this.direcciones.set(nuevas);
          const recien = nuevas.find((d) => d.alias === dto.alias) || nuevas[nuevas.length - 1];
          if (dto.es_predeterminada || nuevas.length === 1) {
            this.ubicacionActiva.set(recien);
          }
        }),
      );
  }
}
