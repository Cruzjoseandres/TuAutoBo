import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mensaje } from '../models';

@Injectable({
  providedIn: 'root',
})
export class MensajesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/mensajes';

  crearMensaje(dto: {
    texto: string;
    url_imagen?: string;
    es_confirmacion_compatibilidad?: boolean;
    remitente_tipo: string;
    remitente_nombre: string;
    usuario_id: string;
    tienda_id: string;
    repuesto_id?: string;
  }): Observable<Mensaje> {
    return this.http.post<Mensaje>(this.apiUrl, dto);
  }

  obtenerHistorialChat(usuario_id: string, tienda_id: string, repuesto_id?: string): Observable<Mensaje[]> {
    let params = new HttpParams().set('usuario_id', usuario_id).set('tienda_id', tienda_id);
    if (repuesto_id) {
      params = params.set('repuesto_id', repuesto_id);
    }
    return this.http.get<Mensaje[]>(`${this.apiUrl}/chat`, { params });
  }

  obtenerConversacionesTienda(tienda_id: string): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/tienda/${tienda_id}`);
  }
}
