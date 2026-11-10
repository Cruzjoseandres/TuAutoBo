import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Usuario, RespuestaAuth } from '../models';
import { environment } from '../../environments/environment';
import { LocalDbService } from './local-db.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly localDb = inject(LocalDbService);
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  // Signals reactivos para el estado del usuario
  readonly usuarioActual = signal<Usuario | null>(null);
  readonly token = signal<string | null>(null);

  // Computados
  readonly estaAutenticado = computed(() => !!this.usuarioActual() && !!this.token());
  readonly rolPrincipal = computed(() => {
    const user = this.usuarioActual();
    if (!user || !user.roles || user.roles.length === 0) return null;
    const primerRol = user.roles[0];
    return typeof primerRol === 'string' ? primerRol : (primerRol as any).nombre;
  });

  constructor() {
    this.cargarSesionSincronaInicial();
  }

  private cargarSesionSincronaInicial() {
    try {
      const tokenGuardado = localStorage.getItem('tuauto_token');
      const usuarioGuardado = localStorage.getItem('tuauto_usuario');
      if (tokenGuardado && usuarioGuardado) {
        const parsed = JSON.parse(usuarioGuardado) as Usuario;
        this.token.set(tokenGuardado);
        this.usuarioActual.set(parsed);
      }
    } catch {
      // Ignorar; se restaurará desde IndexedDB en inicializarSesionDesdeBD
    }
  }

  async inicializarSesionDesdeBD(): Promise<void> {
    const sesion = await this.localDb.obtenerSesion();
    if (sesion && sesion.token && sesion.usuario) {
      this.token.set(sesion.token);
      this.usuarioActual.set(sesion.usuario);
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

          // Persistir sesión en Base de Datos Local IndexedDB + localStorage
          void this.localDb.guardarSesion(res.token, usuario);

          // Redirigir a la pestaña principal de su rol reemplazando /login en el historial
          this.redirigirSegunRol(true);
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
            void this.localDb.guardarSesion(res.token, usuario);
            this.redirigirSegunRol(true);
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
    void this.localDb.limpiarSesion();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  tieneRol(rolRequerido: string): boolean {
    const rol = this.rolPrincipal();
    return rol === rolRequerido;
  }

  obtenerRutaPrincipalPorRol(): string[] {
    const rol = this.rolPrincipal();
    switch (rol) {
      case 'COMPRADOR':
        return ['/comprador', 'catalogo'];
      case 'VENDEDOR':
        return ['/vendedor', 'inventario'];
      case 'REPARTIDOR':
        return ['/repartidor', 'disponibles'];
      case 'ADMINISTRADOR':
        return ['/admin', 'resumen'];
      default:
        return ['/login'];
    }
  }

  redirigirSegunRol(reemplazarHistorial = true) {
    const ruta = this.obtenerRutaPrincipalPorRol();
    this.router.navigate(ruta, { replaceUrl: reemplazarHistorial });
  }
}
