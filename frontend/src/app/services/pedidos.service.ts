import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido } from '../models';

@Injectable({
  providedIn: 'root',
})
export class PedidosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/pedidos';

  findAll(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl);
  }

  findById(id: string): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${id}`);
  }

  findByUsuarioId(usuarioId: string): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  findByTiendaId(tiendaId: string): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/tienda/${tiendaId}`);
  }

  findByRepartidorId(repartidorId: string): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/repartidor/${repartidorId}`);
  }

  obtenerDisponiblesParaRepartidor(
    repartidorId: string,
    lat?: number,
    lon?: number,
  ): Observable<any[]> {
    let url = `${this.apiUrl}/disponibles-repartidor/${repartidorId}`;
    if (lat !== undefined && lon !== undefined) {
      url += `?lat=${lat}&lon=${lon}`;
    }
    return this.http.get<any[]>(url);
  }

  avanzarEstadoRepartidor(
    id: string,
    repartidor_id: string,
    nuevo_estado: string,
  ): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.apiUrl}/${id}/avanzar-estado-repartidor`, {
      repartidor_id,
      nuevo_estado,
    });
  }

  marcarListoDespacho(id: string, tienda_id: string): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.apiUrl}/${id}/marcar-listo-despacho`, {
      tienda_id,
    });
  }

  cotizarEnvio(dto: {
    repuesto_id: string;
    tipo_entrega: string;
    latitud_entrega?: number;
    longitud_entrega?: number;
    cantidad?: number;
  }): Observable<{ tarifa_envio_bs: number; distancia_km: number; detalles: string }> {
    return this.http.post<{ tarifa_envio_bs: number; distancia_km: number; detalles: string }>(
      `${this.apiUrl}/cotizar-envio`,
      dto,
    );
  }

  crearPedido(dto: any): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, dto);
  }

  confirmarPago(id: string, codigo_autorizacion_banco: string): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.apiUrl}/${id}/confirmar-pago`, {
      codigo_autorizacion_banco,
    });
  }

  asignarRepartidor(id: string, repartidor_id: string): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.apiUrl}/${id}/asignar-repartidor`, {
      repartidor_id,
    });
  }

  confirmarEntregaPin(id: string, pin: string): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.apiUrl}/${id}/confirmar-entrega-pin`, { pin });
  }

  iniciarDisputa(id: string, motivo: string): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.apiUrl}/${id}/disputa`, { motivo });
  }

  reembolsar(id: string): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.apiUrl}/${id}/reembolsar`, {});
  }
}
