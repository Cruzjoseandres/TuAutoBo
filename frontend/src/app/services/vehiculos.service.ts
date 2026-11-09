import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vehiculo } from '../models';

@Injectable({
  providedIn: 'root',
})
export class VehiculosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/vehiculos';

  findAll(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(this.apiUrl);
  }

  findByModeloId(modeloId: number): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.apiUrl}/modelo/${modeloId}`);
  }

  findById(id: number): Observable<Vehiculo> {
    return this.http.get<Vehiculo>(`${this.apiUrl}/${id}`);
  }
}
