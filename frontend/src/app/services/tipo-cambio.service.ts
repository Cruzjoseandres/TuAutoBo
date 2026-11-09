import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoCambio } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TipoCambioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tipo-cambio`;

  obtenerRegistro(): Observable<TipoCambio> {
    return this.http.get<TipoCambio>(this.apiUrl);
  }

  sincronizar(): Observable<TipoCambio> {
    return this.http.post<TipoCambio>(`${this.apiUrl}/sincronizar`, {});
  }

  actualizarTasa(tasa_cambio: number, fuente?: string): Observable<TipoCambio> {
    return this.http.patch<TipoCambio>(this.apiUrl, { tasa_cambio, fuente });
  }
}
