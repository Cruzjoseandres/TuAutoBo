import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Parametro } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ParametrosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/parametros`;

  findAll(): Observable<Parametro[]> {
    return this.http.get<Parametro[]>(this.apiUrl);
  }

  findByClave(clave: string): Observable<Parametro> {
    return this.http.get<Parametro>(`${this.apiUrl}/${clave}`);
  }

  actualizar(clave: string, valor: string): Observable<Parametro> {
    return this.http.patch<Parametro>(`${this.apiUrl}/${clave}`, { valor });
  }
}
