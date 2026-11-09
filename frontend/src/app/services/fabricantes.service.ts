import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Fabricante } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FabricantesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/fabricantes`;

  findAll(): Observable<Fabricante[]> {
    return this.http.get<Fabricante[]>(this.apiUrl);
  }

  findById(id: number): Observable<Fabricante> {
    return this.http.get<Fabricante>(`${this.apiUrl}/${id}`);
  }

  crear(dto: Partial<Fabricante>): Observable<Fabricante> {
    return this.http.post<Fabricante>(this.apiUrl, dto);
  }
}
