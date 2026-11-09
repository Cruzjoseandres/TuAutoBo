import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Marca } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MarcasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/marcas`;

  findAll(): Observable<Marca[]> {
    return this.http.get<Marca[]>(this.apiUrl);
  }

  findById(id: number): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/${id}`);
  }

  crear(dto: Partial<Marca>): Observable<Marca> {
    return this.http.post<Marca>(this.apiUrl, dto);
  }
}
