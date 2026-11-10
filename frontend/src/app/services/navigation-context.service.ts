import { Injectable, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { LocalDbService, ContextoCatalogoLocal } from './local-db.service';
import { UbicacionService } from './ubicacion.service';

export interface EntradaHistorial {
  url: string;
  scrollY: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class NavigationContextService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly auth = inject(AuthService);
  private readonly localDb = inject(LocalDbService);
  private readonly ubicacion = inject(UbicacionService);

  private readonly pilaHistorial = signal<EntradaHistorial[]>([]);
  private navegandoConLocationBack = false;
  private ultimoScrollAntesDeSalir = 0;

  // Estado contextual del catálogo del comprador (filtros, búsqueda, moneda y scroll)
  readonly contextoCatalogo = signal<ContextoCatalogoLocal>({
    busqueda: '',
    categoriaId: null,
    vehiculoId: null,
    moneda: 'BOB',
    scrollY: 0,
  });

  // Pila de callbacks para cerrar modales activos al presionar "Atrás"
  private readonly cerradoresModales: Array<() => boolean> = [];

  constructor() {
    this.inicializarRastreoRutas();
    this.hidratarContextoCatalogo();
    this.configurarIntercepcionAtras();
  }

  private inicializarRastreoRutas() {
    this.router.events
      .pipe(filter((e): e is NavigationStart => e instanceof NavigationStart))
      .subscribe((event) => {
        if (typeof window !== 'undefined') {
          this.ultimoScrollAntesDeSalir = window.scrollY || 0;
        }
        if (event.navigationTrigger === 'popstate') {
          this.navegandoConLocationBack = true;
        }
      });

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        const urlActual = event.urlAfterRedirects || event.url;

        // Si el usuario está en /login, reiniciar la pila limpia
        if (urlActual.startsWith('/login')) {
          this.pilaHistorial.set([{ url: '/login', scrollY: 0, timestamp: Date.now() }]);
          this.navegandoConLocationBack = false;
          return;
        }

        const pilaOriginal = [...this.pilaHistorial()];
        // Si ya está autenticado, jamás conservar /login ni /register en la pila
        const pila = this.auth.estaAutenticado()
          ? pilaOriginal.filter(
              (item) => !item.url.startsWith('/login') && !item.url.startsWith('/register'),
            )
          : pilaOriginal;

        // Si fue un retroceso (popstate o botón volver)
        if (this.navegandoConLocationBack) {
          this.navegandoConLocationBack = false;

          // Si por historial del navegador intentó caer en /login o /register estando autenticado, impedirlo y redirigir a su rol
          if (
            this.auth.estaAutenticado() &&
            (urlActual.startsWith('/login') || urlActual.startsWith('/register'))
          ) {
            this.auth.redirigirSegunRol(true);
            return;
          }

          if (pila.length >= 2 && pila[pila.length - 2].url === urlActual) {
            const destino = pila[pila.length - 2];
            pila.pop();
            this.pilaHistorial.set(pila);
            this.restaurarScroll(destino.scrollY);
            return;
          }
        }

        // Guardar el scroll en la vista que acabamos de abandonar
        if (pila.length > 0) {
          pila[pila.length - 1] = {
            ...pila[pila.length - 1],
            scrollY: this.ultimoScrollAntesDeSalir,
          };
        }

        // Evitar duplicar la misma ruta consecutiva
        if (pila.length > 0 && pila[pila.length - 1].url === urlActual) {
          this.pilaHistorial.set(pila);
          return;
        }

        // Si la nueva URL ya era la vista inmediatamente anterior en la pila, desapilar en vez de apilar
        if (pila.length >= 2 && pila[pila.length - 2].url === urlActual) {
          const destino = pila[pila.length - 2];
          pila.pop();
          this.pilaHistorial.set(pila);
          this.restaurarScroll(destino.scrollY);
          return;
        }

        pila.push({
          url: urlActual,
          scrollY: 0,
          timestamp: Date.now(),
        });

        if (pila.length > 25) {
          pila.shift();
        }

        this.pilaHistorial.set(pila);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }
      });
  }

  private async hidratarContextoCatalogo() {
    const guardado = await this.localDb.obtenerContexto<ContextoCatalogoLocal>('catalogo_comprador');
    if (guardado) {
      this.contextoCatalogo.set(guardado);
    }
  }

  guardarEstadoCatalogo(parcial: Partial<ContextoCatalogoLocal>) {
    const actualizado: ContextoCatalogoLocal = {
      ...this.contextoCatalogo(),
      ...parcial,
      scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    };
    this.contextoCatalogo.set(actualizado);
    void this.localDb.guardarContexto('catalogo_comprador', actualizado);
  }

  registrarCerradorModal(fn: () => boolean): () => void {
    this.cerradoresModales.push(fn);
    return () => {
      const idx = this.cerradoresModales.indexOf(fn);
      if (idx >= 0) this.cerradoresModales.splice(idx, 1);
    };
  }

  intentarCerrarModalesActivos(): boolean {
    if (this.ubicacion.modalSelectorAbierto()) {
      this.ubicacion.modalSelectorAbierto.set(false);
      return true;
    }

    for (let i = this.cerradoresModales.length - 1; i >= 0; i--) {
      if (this.cerradoresModales[i]()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Vuelve exactamente a la vista anterior donde estaba el usuario,
   * desapilando el historial real del WebView/navegador para no dejar rutas fantasma.
   */
  volver(fallbackUrl?: string | string[]): void {
    if (this.intentarCerrarModalesActivos()) {
      return;
    }

    const pila = [...this.pilaHistorial()];
    if (pila.length > 1) {
      const anterior = pila[pila.length - 2];
      if (
        anterior &&
        (!this.auth.estaAutenticado() ||
          (!anterior.url.startsWith('/login') && !anterior.url.startsWith('/register')))
      ) {
        // Desapilar usando Location.back() para limpiar la entrada del WebView/Browser
        this.navegandoConLocationBack = true;
        this.location.back();
        return;
      }
    }

    // Fallback seguro si se entró por enlace directo sin historial previo
    if (fallbackUrl) {
      if (Array.isArray(fallbackUrl)) {
        this.router.navigate(fallbackUrl, { replaceUrl: true });
      } else {
        this.router.navigateByUrl(fallbackUrl, { replaceUrl: true });
      }
      return;
    }

    if (this.auth.estaAutenticado()) {
      this.auth.redirigirSegunRol(true);
    } else {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  obtenerEtiquetaDestinoAnterior(etiquetaPorDefecto: string): string {
    const pila = this.pilaHistorial();
    if (pila.length >= 2) {
      const prevUrl = pila[pila.length - 2].url;
      if (prevUrl.includes('/comprador/catalogo')) return 'Volver al Catálogo';
      if (prevUrl.includes('/comprador/pedidos')) return 'Volver a Mis Pedidos';
      if (prevUrl.includes('/comprador/repuesto/')) return 'Volver a la Ficha del Repuesto';
      if (prevUrl.includes('/vendedor/inventario')) return 'Volver al Inventario';
      if (prevUrl.includes('/vendedor/servicios')) return 'Volver a Servicios de Taller';
      if (prevUrl.includes('/vendedor/pedidos')) return 'Volver a Órdenes';
      if (prevUrl.includes('/admin/')) return 'Volver al Panel Admin';
      if (prevUrl.includes('/repartidor/')) return 'Volver al Panel de Despachos';
    }
    return etiquetaPorDefecto;
  }

  esRutaPrincipalDeRol(url: string): boolean {
    const limpia = url.split('?')[0];
    return (
      limpia === '/comprador/catalogo' ||
      limpia === '/vendedor/inventario' ||
      limpia === '/repartidor/disponibles' ||
      limpia === '/admin/resumen' ||
      limpia === '/login'
    );
  }

  private configurarIntercepcionAtras() {
    if (typeof window === 'undefined') return;

    document.addEventListener('backbutton', (event: Event) => {
      if (this.intentarCerrarModalesActivos()) {
        event.preventDefault();
        return;
      }

      const urlActual = this.router.url;
      const pila = this.pilaHistorial();

      if (pila.length > 1) {
        event.preventDefault();
        this.volver();
        return;
      }

      if (this.auth.estaAutenticado() && !this.esRutaPrincipalDeRol(urlActual)) {
        event.preventDefault();
        this.auth.redirigirSegunRol(true);
        return;
      }
      // En la pestaña principal del rol sin historial previo: comportamiento nativo de Android (minimizar)
    });
  }

  private restaurarScroll(scrollY: number) {
    if (typeof window === 'undefined' || scrollY <= 0) return;
    setTimeout(() => {
      window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior });
    }, 60);
  }
}
