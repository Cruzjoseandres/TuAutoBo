import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoVehiculo } from '../models';

@Injectable({
  providedIn: 'root',
})
export class TiposVehiculoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/tipos-vehiculo';

  findAll(): Observable<TipoVehiculo[]> {
    return this.http.get<TipoVehiculo[]>(this.apiUrl);
  }

  findById(id: number): Observable<TipoVehiculo> {
    return this.http.get<TipoVehiculo>(`${this.apiUrl}/${id}`);
  }

  findByCodigo(codigo: string): Observable<TipoVehiculo> {
    return this.http.get<TipoVehiculo>(`${this.apiUrl}/codigo/${codigo}`);
  }
}

