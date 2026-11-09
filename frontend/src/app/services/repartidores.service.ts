import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Repartidor } from '../models';

@Injectable({
  providedIn: 'root',
})
export class RepartidoresService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/repartidores';

  findAll(): Observable<Repartidor[]> {
    return this.http.get<Repartidor[]>(this.apiUrl);
  }

  findById(id: string): Observable<Repartidor> {
    return this.http.get<Repartidor>(`${this.apiUrl}/${id}`);
  }

  findByUsuarioId(usuarioId: string): Observable<Repartidor> {
    return this.http.get<Repartidor>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  registrarSolicitudRepartidor(body: any): Observable<Repartidor> {
    return this.http.post<Repartidor>(`${this.apiUrl}/solicitud-registro`, body);
  }

  aprobarRepartidor(id: string): Observable<Repartidor> {
    return this.http.patch<Repartidor>(`${this.apiUrl}/${id}/aprobar`, {});
  }

  rechazarRepartidor(id: string): Observable<Repartidor> {
    return this.http.patch<Repartidor>(`${this.apiUrl}/${id}/rechazar`, {});
  }

  actualizarUbicacion(id: string, latitud: number, longitud: number): Observable<Repartidor> {
    return this.http.patch<Repartidor>(`${this.apiUrl}/${id}/ubicacion`, { latitud, longitud });
  }

  cambiarEstadoActivo(id: string, esta_activo: boolean): Observable<Repartidor> {
    return this.http.patch<Repartidor>(`${this.apiUrl}/${id}/estado-activo`, { esta_activo });
  }

  actualizarCapacidad(
    id: string,
    capacidad_peso_min_kg: number,
    capacidad_peso_max_kg: number,
    tamano_maximo: string,
  ): Observable<Repartidor> {
    return this.http.patch<Repartidor>(`${this.apiUrl}/${id}/capacidad`, {
      capacidad_peso_min_kg,
      capacidad_peso_max_kg,
      tamano_maximo,
    });
  }
}
