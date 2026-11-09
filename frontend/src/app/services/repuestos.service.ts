import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Repuesto, ResenaRepuesto, RespuestaPaginadaRepuestos } from '../models';

@Injectable({
  providedIn: 'root',
})
export class RepuestosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/repuestos';

  private construirParams(filtros?: {
    marca_id?: number;
    modelo_id?: number;
    vehiculo_id?: number;
    categoria_id?: number;
    busqueda?: string;
    orden?: string;
    pagina?: number;
    limite?: number;
  }): HttpParams {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.marca_id) params = params.set('marca_id', filtros.marca_id);
      if (filtros.modelo_id) params = params.set('modelo_id', filtros.modelo_id);
      if (filtros.vehiculo_id) params = params.set('vehiculo_id', filtros.vehiculo_id);
      if (filtros.categoria_id) params = params.set('categoria_id', filtros.categoria_id);
      if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
      if (filtros.orden) params = params.set('orden', filtros.orden);
      if (filtros.pagina) params = params.set('pagina', filtros.pagina);
      if (filtros.limite) params = params.set('limite', filtros.limite);
    }
    return params;
  }

  buscar(filtros?: {
    marca_id?: number;
    modelo_id?: number;
    vehiculo_id?: number;
    categoria_id?: number;
    busqueda?: string;
    orden?: string;
    pagina?: number;
    limite?: number;
  }): Observable<Repuesto[]> {
    const params = this.construirParams(filtros);
    return this.http.get<Repuesto[]>(this.apiUrl, { params });
  }

  buscarPaginado(filtros?: {
    marca_id?: number;
    modelo_id?: number;
    vehiculo_id?: number;
    categoria_id?: number;
    busqueda?: string;
    orden?: string;
    pagina?: number;
    limite?: number;
  }): Observable<RespuestaPaginadaRepuestos> {
    const params = this.construirParams(filtros);
    return this.http.get<RespuestaPaginadaRepuestos>(`${this.apiUrl}/paginado`, { params });
  }

  findById(id: string): Observable<Repuesto> {
    return this.http.get<Repuesto>(`${this.apiUrl}/${id}`);
  }

  findByTiendaId(tiendaId: string): Observable<Repuesto[]> {
    return this.http.get<Repuesto[]>(`${this.apiUrl}/tienda/${tiendaId}`);
  }

  obtenerResenas(repuestoId: string): Observable<ResenaRepuesto[]> {
    return this.http.get<ResenaRepuesto[]>(`${this.apiUrl}/${repuestoId}/resenas`);
  }

  crearResena(
    repuestoId: string,
    body: {
      autor_nombre: string;
      vehiculo_instalado?: string;
      calificacion: number;
      comentario: string;
    },
  ): Observable<ResenaRepuesto> {
    return this.http.post<ResenaRepuesto>(`${this.apiUrl}/${repuestoId}/resenas`, body);
  }

  create(dto: Partial<Repuesto>): Observable<Repuesto> {
    return this.http.post<Repuesto>(this.apiUrl, dto);
  }

  actualizar(id: string, dto: Partial<Repuesto>): Observable<Repuesto> {
    return this.http.patch<Repuesto>(`${this.apiUrl}/${id}`, dto);
  }

  toggleActivo(id: string): Observable<Repuesto> {
    return this.http.patch<Repuesto>(`${this.apiUrl}/${id}/toggle-activo`, {});
  }

  obtenerOtrasTiendas(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${id}/otras-tiendas`);
  }

  subirImagen(archivo: File | Blob, nombreArchivo: string = 'repuesto.webp'): Observable<{ url: string; filename: string; size: number }> {
    const formData = new FormData();
    formData.append('imagen', archivo, nombreArchivo);
    return this.http.post<{ url: string; filename: string; size: number }>(
      'http://localhost:3000/api/upload/repuesto',
      formData,
    );
  }

  activarBoost(id: string): Observable<Repuesto> {
    return this.http.post<Repuesto>(`${this.apiUrl}/${id}/boost`, {});
  }
}
