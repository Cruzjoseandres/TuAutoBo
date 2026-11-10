import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  AuthService,
  RepuestosService,
  TiendasService,
  MensajesService,
  TipoCambioService,
  ToastService,
  NavigationContextService,
  SocketService,
} from '../../../services';
import { Repuesto, ResenaRepuesto, Tienda, Mensaje } from '../../../models';
import { IconComponent } from '../../../ui';

@Component({
  selector: 'app-detalle-repuesto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './detalle-repuesto.component.html',
})
export class DetalleRepuestoComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  protected readonly navContext = inject(NavigationContextService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly repuestosService = inject(RepuestosService);
  private readonly tiendasService = inject(TiendasService);
  private readonly mensajesService = inject(MensajesService);
  private readonly tipoCambioService = inject(TipoCambioService);
  private readonly toast = inject(ToastService);
  private readonly socketService = inject(SocketService);
  private subs = new Subscription();

  repuesto = signal<Repuesto | null>(null);
  resenas = signal<ResenaRepuesto[]>([]);
  tiendasComparativas = signal<any[]>([]);
  mensajesChat = signal<Mensaje[]>([]);
  cargando = signal<boolean>(true);
  cantidad = signal<number>(1);

  moneda = signal<'BOB' | 'USD'>(this.navContext.contextoCatalogo().moneda || 'BOB');
  tasaDolar = signal<number>(6.96);

  // Pestaña activa inferior: 'empresa' | 'talleres' | 'resenas' | 'chat' | 'comparador'
  tabDetalle = signal<'empresa' | 'talleres' | 'resenas' | 'chat' | 'comparador'>('empresa');

  talleresInstalacion = signal<Tienda[]>([]);

  // Formulario nueva reseña
  nuevaCalificacion = signal<number>(5);
  nuevoVehiculoResena = signal<string>('');
  nuevoComentarioResena = signal<string>('');
  enviandoResena = signal<boolean>(false);

  // Formulario chat técnico
  nuevoMensaje = signal<string>('');

  promedioCalificacion = computed<number | null>(() => {
    const lista = this.resenas();
    if (lista.length === 0) {
      const cal = this.repuesto()?.tienda?.calificacion;
      return cal ? Number(cal) : null;
    }
    const suma = lista.reduce((acc, r) => acc + r.calificacion, 0);
    return Math.round((suma / lista.length) * 10) / 10;
  });

  ngOnInit() {
    this.tipoCambioService.obtenerRegistro().subscribe((tc) => {
      if (tc?.tasa_cambio) this.tasaDolar.set(tc.tasa_cambio);
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalle(id);
    } else {
      this.router.navigate(['/comprador']);
    }

    this.subs.add(
      this.socketService.nuevoMensaje$.subscribe((msg) => {
        const rep = this.repuesto();
        const user = this.auth.usuarioActual();
        if (!rep || !user) return;
        if (msg.usuario_id === user.id && msg.tienda_id === rep.tienda_id && msg.repuesto_id === rep.id) {
          this.mensajesChat.update((actuales) => {
            if (actuales.some((m) => m.id === msg.id)) return actuales;
            return [...actuales, msg];
          });
        }
      }),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  abrirEnMisMensajes() {
    const rep = this.repuesto();
    if (!rep) return;
    this.router.navigate(['/comprador', 'mensajes'], {
      queryParams: {
        tienda_id: rep.tienda_id,
        repuesto_id: rep.id,
      },
    });
  }

  cargarDetalle(id: string) {
    this.cargando.set(true);
    this.repuestosService.findById(id).subscribe({
      next: (rep) => {
        this.repuesto.set(rep);
        this.cargando.set(false);
        if (rep.vehiculo) {
          const mNombre = rep.vehiculo.modelo?.marca?.nombre;
          const modNombre = rep.vehiculo.modelo?.nombre;
          const anio = rep.vehiculo.anio ? ` ${rep.vehiculo.anio}` : '';
          if (mNombre && modNombre) {
            this.nuevoVehiculoResena.set(`${mNombre} ${modNombre}${anio}`);
          }
        }
        this.cargarResenas(id);

        // Cargar SOLO tiendas reales con el mismo OEM activo
        this.repuestosService.obtenerOtrasTiendas(rep.id).subscribe({
          next: (otras) => this.tiendasComparativas.set(otras || []),
          error: () => this.tiendasComparativas.set([]),
        });

        // Cargar talleres aliados para servicios de montaje
        this.tiendasService.findAll().subscribe((t) => {
          this.talleresInstalacion.set(
            t.filter(
              (item) =>
                item.esta_verificada &&
                (item.tipo_establecimiento === 'TALLER_MECANICO' ||
                  item.tipo_establecimiento === 'REPUESTERA_Y_TALLER'),
            ),
          );
        });

        if (rep.tienda_id) {
          this.cargarChat(rep.id, rep.tienda_id);
        }
      },
      error: () => {
        this.cargando.set(false);
        this.router.navigate(['/comprador']);
      },
    });
  }

  cargarResenas(repuestoId: string) {
    this.repuestosService.obtenerResenas(repuestoId).subscribe((r) => {
      this.resenas.set(r);
    });
  }

  cargarChat(repuestoId: string, tiendaId: string) {
    const usuarioId = this.auth.usuarioActual()?.id || '';
    this.mensajesService
      .obtenerHistorialChat(usuarioId, tiendaId, repuestoId)
      .subscribe((m: Mensaje[]) => this.mensajesChat.set(m));
  }

  enviarMensajeChat() {
    const texto = this.nuevoMensaje().trim();
    const rep = this.repuesto();
    const user = this.auth.usuarioActual();
    if (!texto || !rep || !user) return;

    this.mensajesService
      .crearMensaje({
        usuario_id: user.id,
        repuesto_id: rep.id,
        tienda_id: rep.tienda_id,
        remitente_nombre: user.nombre_completo || 'Comprador',
        remitente_tipo: 'COMPRADOR',
        texto,
      })
      .subscribe(() => {
        this.nuevoMensaje.set('');
        this.cargarChat(rep.id, rep.tienda_id);
        this.toast.info('Consulta técnica enviada al especialista de la repuestera');
      });
  }

  publicarResena() {
    const rep = this.repuesto();
    const comentario = this.nuevoComentarioResena().trim();
    const user = this.auth.usuarioActual();
    if (!rep || !comentario) return;

    this.enviandoResena.set(true);
    this.repuestosService
      .crearResena(rep.id, {
        autor_nombre: user?.nombre_completo || 'Usuario TuAuto',
        vehiculo_instalado: this.nuevoVehiculoResena().trim() || undefined,
        calificacion: this.nuevaCalificacion(),
        comentario,
      })
      .subscribe({
        next: () => {
          this.enviandoResena.set(false);
          this.nuevoComentarioResena.set('');
          this.cargarResenas(rep.id);
          this.toast.exito('¡Reseña y calificación publicada con éxito!');
        },
        error: () => {
          this.enviandoResena.set(false);
          this.toast.error('No se pudo publicar la reseña en este momento.');
        },
      });
  }

  formatearPrecio(bob: number, usd: number): string {
    return this.moneda() === 'BOB' ? `Bs ${bob.toFixed(2)}` : `$ ${usd.toFixed(2)} USD`;
  }

  incrementarCantidad() {
    const rep = this.repuesto();
    const maxStock = rep ? (rep.stock_disponible || 10) : 10;
    if (this.cantidad() < maxStock) {
      this.cantidad.update((c) => c + 1);
    } else {
      this.toast.info(`Stock máximo disponible alcanzado (${maxStock} unidades)`);
    }
  }

  decrementarCantidad() {
    if (this.cantidad() > 1) {
      this.cantidad.update((c) => c - 1);
    }
  }

  irAChat() {
    this.tabDetalle.set('chat');
    setTimeout(() => {
      const el = document.getElementById('seccion-chat-tecnico');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      const inp = document.getElementById('input-chat-tecnico') as HTMLInputElement;
      if (inp) {
        inp.focus();
      }
    }, 100);
  }

  volver() {
    this.navContext.volver(['/comprador', 'catalogo']);
  }

  toggleMoneda() {
    const nueva = this.moneda() === 'BOB' ? 'USD' : 'BOB';
    this.moneda.set(nueva);
    this.navContext.guardarEstadoCatalogo({ moneda: nueva });
  }

  irAPagar(repuestoId?: string) {
    const id = repuestoId || this.repuesto()?.id;
    if (id) {
      this.router.navigate(['/comprador/checkout', id], {
        queryParams: { cantidad: this.cantidad() },
      });
    }
  }
}
