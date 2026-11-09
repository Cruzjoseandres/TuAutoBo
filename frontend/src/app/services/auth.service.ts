import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Usuario, RespuestaAuth } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  // Signals reactivos para el estado del usuario
  readonly usuarioActual = signal<Usuario | null>(null);
  readonly token = signal<string | null>(null);

  // Computados
  readonly estaAutenticado = computed(() => !!this.usuarioActual());
  readonly rolPrincipal = computed(() => {
    const user = this.usuarioActual();
    if (!user || !user.roles || user.roles.length === 0) return null;
    const primerRol = user.roles[0];
    return typeof primerRol === 'string' ? primerRol : (primerRol as any).nombre;
  });

  constructor() {
    this.cargarSesionAlmacenada();
  }

  private cargarSesionAlmacenada() {
    const tokenGuardado = localStorage.getItem('tuauto_token');
    const usuarioGuardado = localStorage.getItem('tuauto_usuario');
    if (tokenGuardado && usuarioGuardado) {
      try {
        this.token.set(tokenGuardado);
        this.usuarioActual.set(JSON.parse(usuarioGuardado));
      } catch (e) {
        this.logout();
      }
    }
  }

  login(correo: string, clave: string): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.apiUrl}/login`, { correo, clave })
      .pipe(
        tap((res) => {
          this.token.set(res.token);
          const usuario: Usuario = {
            id: res.id,
            correo: res.correo,
            nombre_completo: res.nombre_completo,
            telefono: res.telefono,
            roles: res.roles,
            token: res.token,
          };
          this.usuarioActual.set(usuario);

          // Persistir sesión de manera segura
          localStorage.setItem('tuauto_token', res.token);
          localStorage.setItem('tuauto_usuario', JSON.stringify(usuario));

          // Redirigir a la vista de su rol
          this.redirigirSegunRol();
        }),
      );
  }

  registrarComprador(dto: {
    correo: string;
    clave: string;
    nombre_completo: string;
    telefono: string;
    ciudad_zona?: string;
  }): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.apiUrl}/registro`, {
        ...dto,
        rol: 'COMPRADOR',
        estado_cuenta: 'ACTIVO',
      })
      .pipe(
        tap((res) => {
          if (res.token) {
            this.token.set(res.token);
            const usuario: Usuario = {
              id: res.id,
              correo: res.correo,
              nombre_completo: res.nombre_completo,
              telefono: res.telefono,
              ciudad_zona: res.ciudad_zona,
              estado_cuenta: res.estado_cuenta,
              roles: res.roles,
              token: res.token,
            };
            this.usuarioActual.set(usuario);
            localStorage.setItem('tuauto_token', res.token);
            localStorage.setItem('tuauto_usuario', JSON.stringify(usuario));
            this.redirigirSegunRol();
          }
        }),
      );
  }

  findAllUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  cambiarEstadoUsuario(id: string, estado_cuenta: string): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${id}/estado`, { estado_cuenta });
  }

  logout() {
    this.token.set(null);
    this.usuarioActual.set(null);
    localStorage.removeItem('tuauto_token');
    localStorage.removeItem('tuauto_usuario');
    this.router.navigate(['/login']);
  }

  tieneRol(rolRequerido: string): boolean {
    const rol = this.rolPrincipal();
    return rol === rolRequerido;
  }

  redirigirSegunRol() {
    const rol = this.rolPrincipal();
    switch (rol) {
      case 'COMPRADOR':
        this.router.navigate(['/comprador']);
        break;
      case 'VENDEDOR':
        this.router.navigate(['/vendedor']);
        break;
      case 'REPARTIDOR':
        this.router.navigate(['/repartidor']);
        break;
      case 'ADMINISTRADOR':
        this.router.navigate(['/admin']);
        break;
      default:
        this.router.navigate(['/login']);
        break;
    }
  }
}
