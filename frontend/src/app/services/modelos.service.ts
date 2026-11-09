import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Modelo } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ModelosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/modelos';

  findAll(): Observable<Modelo[]> {
    return this.http.get<Modelo[]>(this.apiUrl);
  }

  findByMarcaId(marcaId: number): Observable<Modelo[]> {
    return this.http.get<Modelo[]>(`${this.apiUrl}/marca/${marcaId}`);
  }

  findById(id: number): Observable<Modelo> {
    return this.http.get<Modelo>(`${this.apiUrl}/${id}`);
  }
}
