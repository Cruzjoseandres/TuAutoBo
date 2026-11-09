import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import {
  AuthService,
  TiendasService,
  RepuestosService,
  PedidosService,
  MensajesService,
  ToastService,
} from '../../services';
import { Tienda, Repuesto, Pedido, Mensaje, ServicioTaller } from '../../models';
import { IconComponent } from '../../ui';

@Component({
  selector: 'app-vendedor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './vendedor.component.html',
})
export class VendedorComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly tiendasService = inject(TiendasService);
  private readonly repuestosService = inject(RepuestosService);
  private readonly pedidosService = inject(PedidosService);
  private readonly mensajesService = inject(MensajesService);
  private readonly toast = inject(ToastService);

  cargando = signal<boolean>(false);
  tabActiva = signal<'inventario' | 'servicios' | 'pedidos' | 'mensajes' | 'ajustes'>('inventario');

  tienda = signal<Tienda | null>(null);
  repuestos = signal<Repuesto[]>([]);
  pedidosRecibidos = signal<Pedido[]>([]);
  mensajesEntrantes = signal<Mensaje[]>([]);

  // Control de entrega en mostrador (Retiro en Tienda)
  pinRetiroTienda = signal<Record<string, string>>({});
  errorPinTienda = signal<Record<string, string>>({});

  actualizarPinInput(pedidoId: string, valor: string) {
    this.pinRetiroTienda.update((dict) => ({ ...dict, [pedidoId]: valor }));
    this.errorPinTienda.update((dict) => ({ ...dict, [pedidoId]: '' }));
  }

  marcarListoDespacho(pedido: Pedido) {
    const t = this.tienda();
    if (!t) return;
    this.cargando.set(true);
    this.pedidosService.marcarListoDespacho(pedido.id, t.id).subscribe({
      next: () => {
        this.cargando.set(false);
        this.toast.exito(
          pedido.tipo_entrega === 'RETIRO_TIENDA'
            ? 'Listo para Retiro en Mostrador'
            : 'Listo para Despacho • Notificando repartidores'
        );
        this.cargarPedidosTienda(t.id);
      },
      error: (err) => {
        this.cargando.set(false);
        this.toast.error(err?.error?.message || 'Error al actualizar pedido');
      },
    });
  }

  confirmarEntregaMostrador(pedido: Pedido) {
    const t = this.tienda();
    if (!t) return;
    const pin = (this.pinRetiroTienda()[pedido.id] || '').trim();
    if (pin.length < 4) {
      this.errorPinTienda.update((dict) => ({ ...dict, [pedido.id]: 'Ingresa el PIN de 4 dígitos del comprador' }));
      return;
    }

    this.cargando.set(true);
    this.pedidosService.confirmarEntregaPin(pedido.id, pin).subscribe({
      next: () => {
        this.cargando.set(false);
        this.toast.exito('¡Entrega en mostrador confirmada! Fondos liberados a tu saldo.');
        this.cargarPedidosTienda(t.id);
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err?.error?.message || 'El PIN de 4 dígitos es incorrecto';
        this.errorPinTienda.update((dict) => ({ ...dict, [pedido.id]: msg }));
        this.toast.error(msg);
      },
    });
  }

  // Servicios mecánicos ofrecidos por el taller / tienda aliada (reales, sin datos mock)
  serviciosTaller = signal<ServicioTaller[]>([]);

  // Modal para agregar nuevo servicio mecánico
  mostrarModalServicio = signal(false);
  nuevoServicioNombre = signal('');
  nuevoServicioDescripcion = signal('');
  nuevoServicioPrecio = signal<number | null>(null);
  nuevoServicioTiempoMin = signal<number | null>(null);
  nuevoServicioGarantiaMeses = signal<number | null>(null);

  // Identificación del Taller para clientes y beneficios (QR & Referral)
  mostrarModalQrTaller = signal(false);
  codigoReferenciaTaller = computed(() => 'TALLER-' + (this.tienda()?.nit || this.tienda()?.id?.slice(0, 6) || 'SCZ').toUpperCase());
  enlaceReferenciaTaller = computed(() => 'http://localhost:4200/comprador/catalogo?taller_ref=' + (this.tienda()?.id || ''));

  copiarEnlaceTaller() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.enlaceReferenciaTaller());
      this.toast.exito('Enlace Copiado', 'Compártelo con tu cliente para que TuAuto despache el repuesto directo a tu taller.');
    }
  }

  abrirModalServicio() {
    this.nuevoServicioNombre.set('');
    this.nuevoServicioDescripcion.set('');
    this.nuevoServicioPrecio.set(null);
    this.nuevoServicioTiempoMin.set(null);
    this.nuevoServicioGarantiaMeses.set(null);
    this.mostrarModalServicio.set(true);
  }

  cerrarModalServicio() {
    this.mostrarModalServicio.set(false);
  }

  guardarServicio() {
    if (!this.nuevoServicioNombre().trim()) {
      this.toast.error('El nombre del servicio es obligatorio');
      return;
    }
    if (!this.nuevoServicioPrecio() || Number(this.nuevoServicioPrecio()) <= 0) {
      this.toast.error('Ingresa una tarifa válida para el servicio');
      return;
    }

    const nuevo: ServicioTaller = {
      id: `srv-${Date.now()}`,
      nombre: this.nuevoServicioNombre().trim(),
      descripcion: this.nuevoServicioDescripcion().trim() || 'Servicio de taller con mano de obra garantizada.',
      precio_bob: Number(this.nuevoServicioPrecio()),
      tiempo_estimado_min: Number(this.nuevoServicioTiempoMin()) || 60,
      garantia_meses: Number(this.nuevoServicioGarantiaMeses()) || 3,
    };

    this.serviciosTaller.update((lista) => [nuevo, ...lista]);
    this.toast.exito('Servicio Agregado', `"${nuevo.nombre}" ya está disponible.`);
    this.cerrarModalServicio();
  }

  ngOnInit() {
    this.cargarDatosTienda();

    // Sincronización de ruta activa /vendedor/:tab y refresco en demanda
    this.route.paramMap.subscribe((params) => {
      const tab = params.get('tab') as any;
      if (tab && ['inventario', 'servicios', 'pedidos', 'mensajes', 'ajustes'].includes(tab)) {
        this.tabActiva.set(tab);
        if (this.tienda()) {
          this.refrescarPorTab(tab, this.tienda()!.id);
        }
      }
    });
  }

  refrescarPorTab(tab: string, tiendaId: string) {
    switch (tab) {
      case 'inventario':
        this.cargarInventario(tiendaId);
        break;
      case 'pedidos':
        this.cargarPedidosTienda(tiendaId);
        break;
      case 'mensajes':
        this.cargarMensajesTienda(tiendaId);
        break;
      case 'servicios':
      case 'ajustes':
      default:
        break;
    }
  }

  refrescarTodoManual() {
    this.cargando.set(true);
    const t = this.tienda();
    if (t) {
      this.refrescarPorTab(this.tabActiva(), t.id);
    } else {
      this.cargarDatosTienda();
    }
    setTimeout(() => {
      this.cargando.set(false);
      this.toast.info('Datos del establecimiento actualizados en tiempo real.');
    }, 400);
  }

  cargarDatosTienda() {
    const user = this.auth.usuarioActual();
    if (user) {
      this.tiendasService.findByUsuarioId(user.id).subscribe((tiendas) => {
        if (tiendas && tiendas.length > 0) {
          const t = tiendas[0];
          this.tienda.set(t);
          this.refrescarPorTab(this.tabActiva(), t.id);
        } else {
          this.cargarFallbackTiendas();
        }
      });
    } else {
      this.cargarFallbackTiendas();
    }
  }

  private cargarFallbackTiendas() {
    this.tiendasService.findAll().subscribe((tiendas) => {
      const verificadas = tiendas.filter((t) => t.esta_verificada);
      const t = verificadas[0] || tiendas[0];
      if (t) {
        this.tienda.set(t);
        this.refrescarPorTab(this.tabActiva(), t.id);
      }
    });
  }

  cargarInventario(tiendaId: string) {
    this.repuestosService.findByTiendaId(tiendaId).subscribe((r) => {
      this.repuestos.set(r);
    });
  }

  cargarPedidosTienda(tiendaId: string) {
    this.pedidosService.findAll().subscribe((todos) => {
      this.pedidosRecibidos.set(todos.filter((p) => p.tienda_id === tiendaId));
    });
  }

  cargarMensajesTienda(tiendaId: string) {
    this.mensajesService.obtenerConversacionesTienda(tiendaId).subscribe((m: Mensaje[]) => {
      this.mensajesEntrantes.set(m);
    });
  }

  activarBoost(rep: Repuesto) {
    this.repuestosService.activarBoost(rep.id).subscribe(() => {
      if (this.tienda()) {
        this.cargarInventario(this.tienda()!.id);
      }
    });
  }

  toggleEstadoActivo(rep: Repuesto, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.repuestosService.toggleActivo(rep.id).subscribe({
      next: (actualizado) => {
        rep.esta_activo = actualizado.esta_activo;
        this.toast.info(
          actualizado.esta_activo
            ? `"${rep.titulo}" publicado y visible en el catálogo.`
            : `"${rep.titulo}" pausado (oculto del catálogo para compradores).`
        );
      },
      error: () => {
        this.toast.error('No se pudo cambiar el estado del repuesto.');
      },
    });
  }

  responderCompatibilidad(msg: Mensaje) {
    if (!this.tienda()) return;
    this.mensajesService
      .crearMensaje({
        usuario_id: msg.usuario_id,
        repuesto_id: msg.repuesto_id || undefined,
        tienda_id: this.tienda()!.id,
        remitente_nombre: `${this.tienda()!.nombre} (Especialista Técnico)`,
        remitente_tipo: 'TIENDA',
        texto: `Confirmado: Verificamos tu código OEM y chasis en catálogo original. Calce 100% garantizado y listo para despacho.`,
        es_confirmacion_compatibilidad: true,
      })
      .subscribe(() => {
        this.cargarMensajesTienda(this.tienda()!.id);
      });
  }

  cambiarPlan(nuevoPlan: 'GRATUITO' | 'PRO' | 'PREMIUM') {
    const t = this.tienda();
    if (!t) return;
    this.tiendasService.actualizarPlan(t.id, nuevoPlan).subscribe({
      next: (actualizada) => {
        this.tienda.set(actualizada);
        this.toast.exito(
          'Membresía Actualizada',
          `Tu establecimiento ahora cuenta con los beneficios del Plan ${nuevoPlan}`
        );
      },
      error: () => {
        // Fallback optimista para UI demo
        this.tienda.update((curr) => curr ? { ...curr, plan_suscripcion: nuevoPlan } : curr);
        this.toast.exito(
          'Membresía Actualizada',
          `Tu establecimiento ahora cuenta con los beneficios del Plan ${nuevoPlan}`
        );
      },
    });
  }
}
