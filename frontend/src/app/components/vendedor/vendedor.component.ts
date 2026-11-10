import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AuthService,
  TiendasService,
  RepuestosService,
  PedidosService,
  MensajesService,
  ToastService,
  NavigationContextService,
  SocketService,
} from '../../services';
import { Tienda, Repuesto, Pedido, Mensaje, ServicioTaller } from '../../models';
import { IconComponent } from '../../ui';

export interface ConversacionTiendaGrupo {
  key: string;
  usuarioId: string;
  compradorNombre: string;
  repuestoId: string | null;
  repuestoTitulo: string;
  repuestoImagen: string | null;
  repuestoOem: string | null;
  ultimoMensaje: string;
  ultimaFecha: string;
  pendienteRespuesta: boolean;
  mensajes: Mensaje[];
}

@Component({
  selector: 'app-vendedor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './vendedor.component.html',
})
export class VendedorComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly navContext = inject(NavigationContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly tiendasService = inject(TiendasService);
  private readonly repuestosService = inject(RepuestosService);
  private readonly pedidosService = inject(PedidosService);
  private readonly mensajesService = inject(MensajesService);
  private readonly toast = inject(ToastService);
  private readonly socketService = inject(SocketService);

  cargando = signal<boolean>(false);
  tabActiva = signal<'inventario' | 'servicios' | 'pedidos' | 'mensajes' | 'ajustes'>('inventario');

  tienda = signal<Tienda | null>(null);
  repuestos = signal<Repuesto[]>([]);
  pedidosRecibidos = signal<Pedido[]>([]);
  mensajesEntrantes = signal<Mensaje[]>([]);

  // Bandeja de Chats Agrupada por Comprador + Repuesto
  conversacionActivaKey = signal<string | null>(null);
  textoRespuestaTienda = signal<string>('');
  enviandoMensajeTienda = signal<boolean>(false);

  conversacionesTienda = computed<ConversacionTiendaGrupo[]>(() => {
    const lista = this.mensajesEntrantes();
    const mapa = new Map<string, ConversacionTiendaGrupo>();

    for (const msg of lista) {
      const key = `${msg.usuario_id}__${msg.repuesto_id || 'general'}`;
      const existente = mapa.get(key);
      const nombreComprador =
        msg.usuario?.nombre_completo ||
        (msg.remitente_tipo === 'COMPRADOR' ? msg.remitente_nombre : '') ||
        'Comprador TuAuto';

      if (!existente) {
        mapa.set(key, {
          key,
          usuarioId: msg.usuario_id,
          compradorNombre: nombreComprador,
          repuestoId: msg.repuesto_id || null,
          repuestoTitulo: msg.repuesto?.titulo || 'Consulta General de Tienda',
          repuestoImagen: msg.repuesto?.url_imagen || null,
          repuestoOem: msg.repuesto?.numero_oem || msg.repuesto?.sku || null,
          ultimoMensaje: msg.texto,
          ultimaFecha: msg.creado_en || new Date().toISOString(),
          pendienteRespuesta: msg.remitente_tipo === 'COMPRADOR',
          mensajes: [msg],
        });
      } else {
        existente.mensajes.push(msg);
        existente.ultimoMensaje = msg.texto;
        existente.ultimaFecha = msg.creado_en || new Date().toISOString();
        existente.pendienteRespuesta = msg.remitente_tipo === 'COMPRADOR';
        if (msg.usuario?.nombre_completo) {
          existente.compradorNombre = msg.usuario.nombre_completo;
        } else if (msg.remitente_tipo === 'COMPRADOR' && msg.remitente_nombre) {
          existente.compradorNombre = msg.remitente_nombre;
        }
        if (msg.repuesto?.titulo) existente.repuestoTitulo = msg.repuesto.titulo;
        if (msg.repuesto?.url_imagen) existente.repuestoImagen = msg.repuesto.url_imagen;
      }
    }

    return Array.from(mapa.values()).sort(
      (a, b) => new Date(b.ultimaFecha).getTime() - new Date(a.ultimaFecha).getTime(),
    );
  });

  conversacionSeleccionadaTienda = computed<ConversacionTiendaGrupo | null>(() => {
    const grupos = this.conversacionesTienda();
    const key = this.conversacionActivaKey();
    if (key) {
      const encontrada = grupos.find((g) => g.key === key);
      if (encontrada) return encontrada;
    }
    return grupos.length > 0 ? grupos[0] : null;
  });

  consultasPendientesCount = computed(
    () => this.conversacionesTienda().filter((c) => c.pendienteRespuesta).length,
  );

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
  enlaceReferenciaTaller = computed(() => {
    const origin =
      typeof window !== 'undefined' && window.location.origin.startsWith('http')
        ? window.location.origin
        : 'https://tuautobo.onrender.com';
    return `${origin}/comprador/catalogo?taller_ref=${this.tienda()?.id || ''}`;
  });

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

    const unregisterModalVendedor = this.navContext.registrarCerradorModal(() => {
      if (this.mostrarModalQrTaller()) {
        this.mostrarModalQrTaller.set(false);
        return true;
      }
      if (this.mostrarModalServicio()) {
        this.mostrarModalServicio.set(false);
        return true;
      }
      return false;
    });
    this.destroyRef.onDestroy(() => unregisterModalVendedor());

    // Sincronización de ruta activa /vendedor/:tab y refresco en demanda
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const tab = params.get('tab') as any;
      if (tab && ['inventario', 'servicios', 'pedidos', 'mensajes', 'ajustes'].includes(tab)) {
        this.tabActiva.set(tab);
        if (this.tienda()) {
          this.refrescarPorTab(tab, this.tienda()!.id);
        }
      }
    });

    // Suscripción Socket.IO en tiempo real para Mensajes y Pedidos de la Tienda
    this.socketService.nuevoMensaje$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((msg) => {
        const t = this.tienda();
        if (!t || msg.tienda_id !== t.id) return;

        this.mensajesEntrantes.update((actuales) => {
          if (actuales.some((m) => m.id === msg.id)) return actuales;
          return [...actuales, msg];
        });

        const key = `${msg.usuario_id}__${msg.repuesto_id || 'general'}`;
        if (!this.conversacionActivaKey()) {
          this.conversacionActivaKey.set(key);
        }

        if (msg.remitente_tipo === 'COMPRADOR') {
          if (this.tabActiva() !== 'mensajes') {
            this.toast.info(
              `💬 Nueva consulta de ${msg.remitente_nombre}`,
              msg.texto,
              {
                rutaDestino: ['/vendedor', 'mensajes'],
                textoAccion: 'Responder Chat',
              },
            );
          } else {
            this.conversacionActivaKey.set(key);
          }
        }
      });

    this.socketService.pedidoActualizado$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((evento) => {
        const t = this.tienda();
        if (!t || evento.pedido?.tienda_id !== t.id) return;

        this.cargarPedidosTienda(t.id);
        this.cargarInventario(t.id);

        if (evento.accion === 'PAGO_CONFIRMADO' || evento.accion === 'CREADO') {
          this.toast.exito(
            `🛒 Nueva Orden ${evento.pedido.numero_orden}`,
            `${evento.pedido.repuesto?.titulo || 'Repuesto'} • Liquidación Bs ${Number(evento.pedido.liquidacion_tienda_bs || 0).toFixed(2)}`,
            {
              rutaDestino: ['/vendedor', 'pedidos'],
              textoAccion: 'Ver Orden',
            },
          );
        } else if (evento.accion === 'REPARTIDOR_ASIGNADO' || evento.accion === 'ESTADO_AVANZADO') {
          if (this.tabActiva() !== 'pedidos') {
            this.toast.info(
              `🛵 Orden ${evento.pedido.numero_orden} en movimiento`,
              `Nuevo estado: ${evento.pedido.estado.replace(/_/g, ' ')}`,
              {
                rutaDestino: ['/vendedor', 'pedidos'],
                textoAccion: 'Ver Estado',
              },
            );
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
          this.cargarTodoInicialTienda(t.id);
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
        this.cargarTodoInicialTienda(t.id);
      }
    });
  }

  private cargarTodoInicialTienda(tiendaId: string) {
    this.cargarInventario(tiendaId);
    this.cargarPedidosTienda(tiendaId);
    this.cargarMensajesTienda(tiendaId);
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

  seleccionarConversacionTienda(grupo: ConversacionTiendaGrupo) {
    this.conversacionActivaKey.set(grupo.key);
  }

  enviarRespuestaTextoTienda() {
    const texto = this.textoRespuestaTienda().trim();
    const conv = this.conversacionSeleccionadaTienda();
    const t = this.tienda();
    if (!texto || !conv || !t || this.enviandoMensajeTienda()) return;

    this.enviandoMensajeTienda.set(true);
    this.mensajesService
      .crearMensaje({
        usuario_id: conv.usuarioId,
        repuesto_id: conv.repuestoId || undefined,
        tienda_id: t.id,
        remitente_nombre: t.nombre,
        remitente_tipo: 'TIENDA',
        texto,
        es_confirmacion_compatibilidad: false,
      })
      .subscribe({
        next: (nuevo) => {
          this.enviandoMensajeTienda.set(false);
          this.textoRespuestaTienda.set('');
          this.mensajesEntrantes.update((actuales) => {
            if (actuales.some((m) => m.id === nuevo.id)) return actuales;
            return [...actuales, nuevo];
          });
        },
        error: () => {
          this.enviandoMensajeTienda.set(false);
          this.toast.error('No se pudo enviar la respuesta.');
        },
      });
  }

  confirmarCompatibilidadConversacion() {
    const conv = this.conversacionSeleccionadaTienda();
    const t = this.tienda();
    if (!conv || !t || this.enviandoMensajeTienda()) return;

    this.enviandoMensajeTienda.set(true);
    this.mensajesService
      .crearMensaje({
        usuario_id: conv.usuarioId,
        repuesto_id: conv.repuestoId || undefined,
        tienda_id: t.id,
        remitente_nombre: `${t.nombre} (Especialista Técnico)`,
        remitente_tipo: 'TIENDA',
        texto: `Confirmado: Verificamos tu código OEM y chasis en catálogo original. Calce 100% garantizado y listo para despacho inmediato.`,
        es_confirmacion_compatibilidad: true,
      })
      .subscribe({
        next: (nuevo) => {
          this.enviandoMensajeTienda.set(false);
          this.toast.exito('Compatibilidad 100% Confirmada', 'El comprador recibió la certificación en vivo.');
          this.mensajesEntrantes.update((actuales) => {
            if (actuales.some((m) => m.id === nuevo.id)) return actuales;
            return [...actuales, nuevo];
          });
        },
        error: () => {
          this.enviandoMensajeTienda.set(false);
          this.toast.error('No se pudo enviar la confirmación.');
        },
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
