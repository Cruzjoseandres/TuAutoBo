import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tienda } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TiendasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tiendas`;

  findAll(): Observable<Tienda[]> {
    return this.http.get<Tienda[]>(this.apiUrl);
  }

  findById(id: string): Observable<Tienda> {
    return this.http.get<Tienda>(`${this.apiUrl}/${id}`);
  }

  findByUsuarioId(usuarioId: string): Observable<Tienda[]> {
    return this.http.get<Tienda[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  registrarSolicitudTienda(body: any): Observable<Tienda> {
    return this.http.post<Tienda>(`${this.apiUrl}/solicitud-registro`, body);
  }

  aprobarTienda(id: string): Observable<Tienda> {
    return this.http.patch<Tienda>(`${this.apiUrl}/${id}/aprobar`, {});
  }

  rechazarTienda(id: string): Observable<Tienda> {
    return this.http.patch<Tienda>(`${this.apiUrl}/${id}/rechazar`, {});
  }

  actualizarPlan(id: string, plan: string): Observable<Tienda> {
    return this.http.patch<Tienda>(`${this.apiUrl}/${id}/plan`, { plan });
  }
}
