import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  AuthService,
  MarcasService,
  ModelosService,
  VehiculosService,
  CategoriasService,
  RepuestosService,
  PedidosService,
  MensajesService,
  TipoCambioService,
  UbicacionService,
  NavigationContextService,
  SocketService,
  ToastService,
} from '../../services';
import {
  Marca,
  Modelo,
  Vehiculo,
  Categoria,
  Repuesto,
  Pedido,
  Mensaje,
} from '../../models';
import { CustomSelectComponent, SelectOption } from '../shared/custom-select.component';

export interface ConversacionCompradorGrupo {
  key: string;
  tiendaId: string;
  tiendaNombre: string;
  repuestoId: string | null;
  repuestoTitulo: string;
  repuestoImagen: string | null;
  repuestoPrecioBob: number | null;
  repuestoOem: string | null;
  ultimoMensaje: string;
  ultimaFecha: string;
  mensajes: Mensaje[];
}

@Component({
  selector: 'app-comprador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CustomSelectComponent],
  templateUrl: './comprador.component.html',
})
export class CompradorComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  protected readonly ubicacion = inject(UbicacionService);
  protected readonly navContext = inject(NavigationContextService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly marcasService = inject(MarcasService);
  private readonly modelosService = inject(ModelosService);
  private readonly vehiculosService = inject(VehiculosService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly repuestosService = inject(RepuestosService);
  private readonly pedidosService = inject(PedidosService);
  private readonly mensajesService = inject(MensajesService);
  private readonly tipoCambioService = inject(TipoCambioService);
  private readonly socketService = inject(SocketService);
  private readonly toast = inject(ToastService);

  private desregistrarModal?: () => void;
  private subs = new Subscription();

  // Pestañas del comprador ('catalogo' | 'pedidos' | 'mensajes')
  seccionActiva = signal<'catalogo' | 'pedidos' | 'mensajes'>('catalogo');

  // Divisa activa
  moneda = signal<'BOB' | 'USD'>('BOB');
  tasaDolar = signal<number>(6.96);

  // Garaje del comprador
  vehiculoSeleccionado = signal<Vehiculo | null>(null);
  modalGarajeAbierto = signal<boolean>(false);
  marcaTemp = signal<number | null>(null);
  modeloTemp = signal<number | null>(null);

  // Datos
  marcas = signal<Marca[]>([]);
  modelos = signal<Modelo[]>([]);
  vehiculos = signal<Vehiculo[]>([]);
  categorias = signal<Categoria[]>([]);
  repuestos = signal<Repuesto[]>([]);
  misPedidos = signal<Pedido[]>([]);

  // Bandeja de Mensajes Agrupada por Repuesto + Tienda
  todosLosMensajes = signal<Mensaje[]>([]);
  repuestoPreseleccionadoChat = signal<Repuesto | null>(null);
  conversacionActivaKey = signal<string | null>(null);
  textoRespuestaChat = signal<string>('');
  enviandoMensaje = signal<boolean>(false);
  mensajesNoLeidosCount = signal<number>(0);

  conversacionesAgrupadas = computed<ConversacionCompradorGrupo[]>(() => {
    const lista = this.todosLosMensajes();
    const mapa = new Map<string, ConversacionCompradorGrupo>();

    for (const msg of lista) {
      const key = `${msg.tienda_id}__${msg.repuesto_id || 'general'}`;
      const existente = mapa.get(key);
      if (!existente) {
        mapa.set(key, {
          key,
          tiendaId: msg.tienda_id,
          tiendaNombre: msg.tienda?.nombre || msg.remitente_nombre || 'Tienda Repuestera',
          repuestoId: msg.repuesto_id || null,
          repuestoTitulo: msg.repuesto?.titulo || 'Consulta General de Repuesto',
          repuestoImagen: msg.repuesto?.url_imagen || null,
          repuestoPrecioBob: msg.repuesto?.precio_bob ? Number(msg.repuesto.precio_bob) : null,
          repuestoOem: msg.repuesto?.numero_oem || msg.repuesto?.sku || null,
          ultimoMensaje: msg.texto,
          ultimaFecha: msg.creado_en || new Date().toISOString(),
          mensajes: [msg],
        });
      } else {
        existente.mensajes.push(msg);
        existente.ultimoMensaje = msg.texto;
        existente.ultimaFecha = msg.creado_en || new Date().toISOString();
        if (msg.tienda?.nombre) existente.tiendaNombre = msg.tienda.nombre;
        if (msg.repuesto?.titulo) existente.repuestoTitulo = msg.repuesto.titulo;
        if (msg.repuesto?.url_imagen) existente.repuestoImagen = msg.repuesto.url_imagen;
      }
    }

    // Si el usuario vino desde un repuesto con "Abrir en Mis Mensajes" y aún no escribió, agregar hilo borrador
    const repPre = this.repuestoPreseleccionadoChat();
    if (repPre && repPre.tienda_id) {
      const preKey = `${repPre.tienda_id}__${repPre.id}`;
      if (!mapa.has(preKey)) {
        mapa.set(preKey, {
          key: preKey,
          tiendaId: repPre.tienda_id,
          tiendaNombre: repPre.tienda?.nombre || 'Tienda Repuestera',
          repuestoId: repPre.id,
          repuestoTitulo: repPre.titulo,
          repuestoImagen: repPre.url_imagen || null,
          repuestoPrecioBob: Number(repPre.precio_bob) || null,
          repuestoOem: repPre.numero_oem || repPre.sku || null,
          ultimoMensaje: 'Nueva consulta sobre este repuesto...',
          ultimaFecha: new Date().toISOString(),
          mensajes: [],
        });
      }
    }

    return Array.from(mapa.values()).sort(
      (a, b) => new Date(b.ultimaFecha).getTime() - new Date(a.ultimaFecha).getTime(),
    );
  });

  conversacionSeleccionada = computed<ConversacionCompradorGrupo | null>(() => {
    const grupos = this.conversacionesAgrupadas();
    const keyActiva = this.conversacionActivaKey();
    if (keyActiva) {
      const encontrada = grupos.find((g) => g.key === keyActiva);
      if (encontrada) return encontrada;
    }
    return grupos.length > 0 ? grupos[0] : null;
  });

  // Filtros y Paginación
  categoriaId = signal<number | null>(null);
  busqueda = signal<string>('');
  orden = signal<string>('RECIENTES');
  limitePorPagina = signal<number>(9);
  paginaActual = signal<number>(1);
  totalResultados = signal<number>(0);
  totalPaginas = signal<number>(1);
  cargandoCatalogo = signal<boolean>(false);

  // Opciones Apple para CustomSelect
  opcionesOrden: SelectOption[] = [
    { valor: 'RECIENTES', etiqueta: 'Patrocinados & Recientes' },
    { valor: 'PRECIO_ASC', etiqueta: 'Menor Precio' },
    { valor: 'PRECIO_DESC', etiqueta: 'Mayor Precio' },
  ];

  opcionesLimite: SelectOption[] = [
    { valor: 6, etiqueta: '6 productos' },
    { valor: 9, etiqueta: '9 productos' },
    { valor: 18, etiqueta: '18 productos' },
    { valor: 36, etiqueta: '36 productos' },
  ];

  cargandoManual = signal<boolean>(false);

  ngOnInit() {
    // Restaurar filtros del contexto si el usuario regresó desde Detalle o Checkout
    const ctx = this.navContext.contextoCatalogo();
    if (ctx.busqueda) this.busqueda.set(ctx.busqueda);
    if (ctx.categoriaId !== null) this.categoriaId.set(ctx.categoriaId);
    if (ctx.moneda) this.moneda.set(ctx.moneda);

    this.desregistrarModal = this.navContext.registrarCerradorModal(() => {
      if (this.modalGarajeAbierto()) {
        this.modalGarajeAbierto.set(false);
        return true;
      }
      return false;
    });

    this.cargarDatos();
    this.conectarSocketsEnTiempoReal();

    // Sincronización de ruta activa /comprador/:tab y refresco en demanda
    this.subs.add(
      this.route.paramMap.subscribe((params) => {
        const tab = params.get('tab') as any;
        if (tab && ['catalogo', 'pedidos', 'mensajes'].includes(tab)) {
          this.seccionActiva.set(tab);
          if (tab === 'pedidos') {
            this.cargarMisPedidos();
          } else if (tab === 'catalogo') {
            this.cargarRepuestos();
          } else if (tab === 'mensajes') {
            this.mensajesNoLeidosCount.set(0);
            this.cargarMisMensajes();
          }
        }
      }),
    );

    // Preseleccionar hilo Repuesto + Tienda cuando viene con queryParams
    this.subs.add(
      this.route.queryParamMap.subscribe((qParams) => {
        const tiendaId = qParams.get('tienda_id');
        const repuestoId = qParams.get('repuesto_id');
        if (tiendaId) {
          const key = `${tiendaId}__${repuestoId || 'general'}`;
          this.conversacionActivaKey.set(key);
          if (repuestoId) {
            this.repuestosService.findById(repuestoId).subscribe({
              next: (rep) => this.repuestoPreseleccionadoChat.set(rep),
              error: () => {},
            });
          }
        }
      }),
    );
  }

  ngOnDestroy() {
    this.desregistrarModal?.();
    this.subs.unsubscribe();
  }

  private conectarSocketsEnTiempoReal() {
    // Escuchar nuevos mensajes en vivo
    this.subs.add(
      this.socketService.nuevoMensaje$.subscribe((msg) => {
        const user = this.auth.usuarioActual();
        if (!user || msg.usuario_id !== user.id) return;

        this.todosLosMensajes.update((actuales) => {
          if (actuales.some((m) => m.id === msg.id)) return actuales;
          return [...actuales, msg];
        });

        const key = `${msg.tienda_id}__${msg.repuesto_id || 'general'}`;
        if (!this.conversacionActivaKey()) {
          this.conversacionActivaKey.set(key);
        }

        if (msg.remitente_tipo === 'TIENDA') {
          if (this.seccionActiva() !== 'mensajes') {
            this.mensajesNoLeidosCount.update((n) => n + 1);
            this.toast.info(
              `💬 Respuesta de ${msg.tienda?.nombre || msg.remitente_nombre}`,
              msg.texto,
              {
                rutaDestino: ['/comprador', 'mensajes'],
                queryParams: {
                  tienda_id: msg.tienda_id,
                  repuesto_id: msg.repuesto_id || '',
                },
                textoAccion: 'Ver Chat',
              },
            );
          }
        }
      }),
    );

    // Escuchar actualizaciones de pedidos en vivo
    this.subs.add(
      this.socketService.pedidoActualizado$.subscribe((evento) => {
        const user = this.auth.usuarioActual();
        if (!user || evento.pedido?.usuario_comprador_id !== user.id) return;

        this.cargarMisPedidos();

        if (evento.accion !== 'CREADO' && evento.accion !== 'PAGO_CONFIRMADO') {
          this.toast.info(
            `📦 Pedido ${evento.pedido.numero_orden} actualizado`,
            `Estado actual: ${evento.pedido.estado.replace(/_/g, ' ')}`,
            {
              rutaDestino: ['/comprador', 'pedidos'],
              textoAccion: 'Ver Pedido',
            },
          );
        }
      }),
    );
  }

  refrescarManual() {
    this.cargandoManual.set(true);
    if (this.seccionActiva() === 'pedidos') {
      this.cargarMisPedidos();
    } else if (this.seccionActiva() === 'mensajes') {
      this.cargarMisMensajes();
    } else {
      this.cargarRepuestos();
    }
    this.ubicacion.cargarDireccionesUsuario();
    setTimeout(() => {
      this.cargandoManual.set(false);
    }, 400);
  }

  cargarDatos() {
    this.tipoCambioService.obtenerRegistro().subscribe((tc) => {
      if (tc?.tasa_cambio) this.tasaDolar.set(tc.tasa_cambio);
    });
    this.marcasService.findAll().subscribe((d) => this.marcas.set(d));
    this.categoriasService.findAll().subscribe((d) => this.categorias.set(d));

    this.cargarRepuestos();
    this.cargarMisPedidos();
    this.cargarMisMensajes();
  }

  cargarMisMensajes() {
    const user = this.auth.usuarioActual();
    if (!user) return;
    this.mensajesService.obtenerConversacionesComprador(user.id).subscribe({
      next: (mensajes) => {
        this.todosLosMensajes.set(mensajes || []);
      },
      error: () => {},
    });
  }

  seleccionarConversacion(grupo: ConversacionCompradorGrupo) {
    this.conversacionActivaKey.set(grupo.key);
  }

  enviarMensajeDesdeBandeja() {
    const texto = this.textoRespuestaChat().trim();
    const conv = this.conversacionSeleccionada();
    const user = this.auth.usuarioActual();
    if (!texto || !conv || !user || this.enviandoMensaje()) return;

    this.enviandoMensaje.set(true);
    this.mensajesService
      .crearMensaje({
        usuario_id: user.id,
        tienda_id: conv.tiendaId,
        repuesto_id: conv.repuestoId || undefined,
        remitente_nombre: user.nombre_completo || 'Comprador',
        remitente_tipo: 'COMPRADOR',
        texto,
      })
      .subscribe({
        next: (nuevo) => {
          this.enviandoMensaje.set(false);
          this.textoRespuestaChat.set('');
          this.todosLosMensajes.update((actuales) => {
            if (actuales.some((m) => m.id === nuevo.id)) return actuales;
            return [...actuales, nuevo];
          });
        },
        error: () => {
          this.enviandoMensaje.set(false);
          this.toast.error('No se pudo enviar el mensaje.');
        },
      });
  }

  seleccionarCategoria(id: number | null) {
    this.categoriaId.set(id);
    this.paginaActual.set(1);
    this.navContext.guardarEstadoCatalogo({ categoriaId: id });
    this.cargarRepuestos();
  }

  onBusquedaChange(valor: string) {
    this.busqueda.set(valor);
    this.paginaActual.set(1);
    this.navContext.guardarEstadoCatalogo({ busqueda: valor });
    this.cargarRepuestos();
  }

  cambiarLimite(nuevoLimite: number) {
    this.limitePorPagina.set(nuevoLimite);
    this.paginaActual.set(1);
    this.cargarRepuestos();
  }

  cambiarOrden(nuevoOrden: string) {
    this.orden.set(nuevoOrden);
    this.paginaActual.set(1);
    this.cargarRepuestos();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPaginas()) return;
    this.paginaActual.set(nuevaPagina);
    this.cargarRepuestos();
  }

  cargarRepuestos() {
    this.cargandoCatalogo.set(true);
    this.repuestosService
      .buscarPaginado({
        vehiculo_id: this.vehiculoSeleccionado()?.id || undefined,
        modelo_id: this.modeloTemp() || undefined,
        marca_id: this.marcaTemp() || undefined,
        categoria_id: this.categoriaId() || undefined,
        busqueda: this.busqueda() || undefined,
        orden: this.orden(),
        pagina: this.paginaActual(),
        limite: this.limitePorPagina(),
      })
      .subscribe({
        next: (res) => {
          this.repuestos.set(res.datos);
          this.totalResultados.set(res.total);
          this.totalPaginas.set(res.total_paginas);
          this.cargandoCatalogo.set(false);
        },
        error: () => {
          this.cargandoCatalogo.set(false);
        },
      });
  }

  cargarMisPedidos() {
    const user = this.auth.usuarioActual();
    if (!user) return;
    this.pedidosService.findByUsuarioId(user.id).subscribe((d) => this.misPedidos.set(d));
  }

  onSelectMarca(id: number) {
    this.marcaTemp.set(id);
    this.modeloTemp.set(null);
    this.modelosService.findByMarcaId(id).subscribe((d) => this.modelos.set(d));
  }

  onSelectModelo(id: number) {
    this.modeloTemp.set(id);
    this.vehiculosService.findByModeloId(id).subscribe((d) => this.vehiculos.set(d));
  }

  onConfirmVehiculo(v: Vehiculo) {
    this.vehiculoSeleccionado.set(v);
    this.modalGarajeAbierto.set(false);
    this.paginaActual.set(1);
    this.navContext.guardarEstadoCatalogo({ vehiculoId: v.id });
    this.cargarRepuestos();
  }

  onClearVehiculo() {
    this.vehiculoSeleccionado.set(null);
    this.marcaTemp.set(null);
    this.modeloTemp.set(null);
    this.paginaActual.set(1);
    this.navContext.guardarEstadoCatalogo({ vehiculoId: null });
    this.cargarRepuestos();
  }

  toggleMoneda() {
    const nueva = this.moneda() === 'BOB' ? 'USD' : 'BOB';
    this.moneda.set(nueva);
    this.navContext.guardarEstadoCatalogo({ moneda: nueva });
  }

  formatearPrecio(bob: number, usd: number): string {
    return this.moneda() === 'BOB' ? `Bs ${bob.toFixed(2)}` : `$ ${usd.toFixed(2)} USD`;
  }

  verDetalleRepuesto(rep: Repuesto) {
    this.navContext.guardarEstadoCatalogo({});
    this.router.navigate(['/comprador/repuesto', rep.id]);
  }

  irAPagarDirecto(rep: Repuesto, event: Event) {
    event.stopPropagation();
    this.navContext.guardarEstadoCatalogo({});
    this.router.navigate(['/comprador/checkout', rep.id]);
  }
}
