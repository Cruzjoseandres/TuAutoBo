import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import {
  AuthService,
  ParametrosService,
  TipoCambioService,
  PedidosService,
  TiendasService,
  RepartidoresService,
  CategoriasService,
  MarcasService,
  FabricantesService,
} from '../../services';
import {
  Parametro,
  TipoCambio,
  Pedido,
  Tienda,
  Repartidor,
  Usuario,
  Categoria,
  Marca,
  Fabricante,
} from '../../models';
import { SelectComponent, SelectOption, IconComponent, BadgeComponent } from '../../ui';

type SeccionAdmin =
  | 'resumen'
  | 'solicitudes'
  | 'aliados'
  | 'catalogo'
  | 'ordenes'
  | 'parametros';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SelectComponent, IconComponent],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly parametrosService = inject(ParametrosService);
  private readonly tipoCambioService = inject(TipoCambioService);
  private readonly pedidosService = inject(PedidosService);
  private readonly tiendasService = inject(TiendasService);
  private readonly repartidoresService = inject(RepartidoresService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly marcasService = inject(MarcasService);
  private readonly fabricantesService = inject(FabricantesService);

  cargando = signal<boolean>(false);

  readonly opcionesPlanTienda: SelectOption[] = [
    { value: 'GRATUITO', label: 'Plan Básico (10%)' },
    { value: 'PRO', label: 'Plan PRO (7%)' },
    { value: 'PREMIUM', label: 'Plan PREMIUM (5%)' },
  ];

  readonly opcionesEstadoUsuario: SelectOption[] = [
    { value: 'ACTIVO', label: 'ACTIVO' },
    { value: 'PENDIENTE_APROBACION', label: 'PENDIENTE' },
    { value: 'RECHAZADO', label: 'SUSPENDIDO' },
  ];

  opcionesFiltroOrden = computed<SelectOption[]>(() => [
    { value: 'TODOS', label: `Todos los estados (${this.pedidos().length})` },
    { value: 'PAGADO_ESCROW', label: 'En Custodia Escrow' },
    { value: 'EN_CAMINO', label: 'En Camino (Repartidor)' },
    { value: 'ENTREGADO', label: 'Entregados y Liquidados' },
    { value: 'DISPUTA', label: `En Disputa (${this.pedidosDisputa().length})` },
    { value: 'REEMBOLSADO', label: 'Reembolsados' },
  ]);

  // Navegación del panel administrador
  seccionActiva = signal<SeccionAdmin>('resumen');
  subTabAliados = signal<'tiendas' | 'repartidores' | 'usuarios'>('tiendas');
  filtroEstadoOrden = signal<string>('TODOS');

  // Datos del ecosistema
  parametros = signal<Parametro[]>([]);
  tipoCambio = signal<TipoCambio | null>(null);
  pedidos = signal<Pedido[]>([]);
  tiendas = signal<Tienda[]>([]);
  repartidores = signal<Repartidor[]>([]);
  usuarios = signal<Usuario[]>([]);
  categorias = signal<Categoria[]>([]);
  marcas = signal<Marca[]>([]);
  fabricantes = signal<Fabricante[]>([]);

  // Edición de parámetros y tasa de cambio
  parametroEditando = signal<{ clave: string; valor: string } | null>(null);
  nuevaTasa = signal<number>(6.96);

  // Formularios Catálogo Maestro
  nuevaCategoriaNombre = signal<string>('');
  nuevaCategoriaIcono = signal<string>('');
  nuevaMarcaNombre = signal<string>('');
  nuevaMarcaLogo = signal<string>('');
  nuevoFabricanteNombre = signal<string>('');
  nuevoFabricanteOrigen = signal<string>('');
  nuevoFabricanteOem = signal<boolean>(true);

  // Notificación visual interna
  notificacion = signal<string>('');

  // Computados de KPIs y Solicitudes Pendientes
  tiendasPendientes = computed(() =>
    this.tiendas().filter(
      (t) =>
        !t.esta_verificada &&
        t.usuario?.estado_cuenta !== 'RECHAZADO',
    ),
  );

  repartidoresPendientes = computed(() =>
    this.repartidores().filter(
      (r) =>
        !r.esta_verificado &&
        r.usuario?.estado_cuenta !== 'RECHAZADO',
    ),
  );

  totalSolicitudesPendientes = computed(
    () => this.tiendasPendientes().length + this.repartidoresPendientes().length,
  );

  pedidosDisputa = computed(() =>
    this.pedidos().filter((p) => p.estado === 'DISPUTA'),
  );

  pedidosFiltrados = computed(() => {
    const estado = this.filtroEstadoOrden();
    if (estado === 'TODOS') return this.pedidos();
    return this.pedidos().filter((p) => p.estado === estado);
  });

  gmvTotalBs = computed(() =>
    this.pedidos()
      .filter((p) => p.estado !== 'REEMBOLSADO')
      .reduce((acc, p) => acc + Number(p.total_bs || 0), 0),
  );

  custodiaEscrowBs = computed(() =>
    this.pedidos()
      .filter((p) => p.estado === 'PAGADO_ESCROW' || p.estado === 'EN_CAMINO')
      .reduce((acc, p) => acc + Number(p.total_bs || 0), 0),
  );

  ingresosPlataformaBs = computed(() =>
    this.pedidos()
      .filter((p) => p.estado !== 'REEMBOLSADO')
      .reduce(
        (acc, p) =>
          acc +
          Number(p.comision_tuauto_bs || 0) +
          Number(p.tarifa_servicio_app_bs || 0),
        0,
      ),
  );

  ngOnInit() {
    this.cargarDatosAdmin();

    // Sincronizar ruta activa de URL /admin/:tab
    this.route.paramMap.subscribe((params) => {
      const tab = params.get('tab') as SeccionAdmin;
      if (tab && ['resumen', 'solicitudes', 'aliados', 'catalogo', 'ordenes', 'parametros'].includes(tab)) {
        this.seccionActiva.set(tab);
        this.refrescarDatosPorSeccion(tab);
      }
    });
  }

  mostrarAviso(mensaje: string) {
    this.notificacion.set(mensaje);
    setTimeout(() => {
      if (this.notificacion() === mensaje) {
        this.notificacion.set('');
      }
    }, 4500);
  }

  refrescarDatosPorSeccion(seccion: SeccionAdmin) {
    switch (seccion) {
      case 'solicitudes':
        this.tiendasService.findAll().subscribe((d) => this.tiendas.set(d));
        this.repartidoresService.findAll().subscribe((d) => this.repartidores.set(d));
        break;
      case 'aliados':
        this.tiendasService.findAll().subscribe((d) => this.tiendas.set(d));
        this.repartidoresService.findAll().subscribe((d) => this.repartidores.set(d));
        this.auth.findAllUsuarios().subscribe((d) => this.usuarios.set(d));
        break;
      case 'catalogo':
        this.categoriasService.findAll().subscribe((d) => this.categorias.set(d));
        this.marcasService.findAll().subscribe((d) => this.marcas.set(d));
        this.fabricantesService.findAll().subscribe((d) => this.fabricantes.set(d));
        break;
      case 'ordenes':
        this.pedidosService.findAll().subscribe((peds) => this.pedidos.set(peds));
        break;
      case 'parametros':
        this.parametrosService.findAll().subscribe((d) => this.parametros.set(d));
        this.tipoCambioService.obtenerRegistro().subscribe((tc) => {
          this.tipoCambio.set(tc);
          if (tc?.tasa_cambio) this.nuevaTasa.set(tc.tasa_cambio);
        });
        break;
      case 'resumen':
      default:
        this.cargarDatosAdmin();
        break;
    }
  }

  refrescarTodoManual() {
    this.cargando.set(true);
    this.refrescarDatosPorSeccion(this.seccionActiva());
    setTimeout(() => {
      this.cargando.set(false);
      this.mostrarAviso('Datos sincronizados en tiempo real con el servidor.');
    }, 400);
  }

  cargarDatosAdmin() {
    this.parametrosService.findAll().subscribe((d) => this.parametros.set(d));
    this.tipoCambioService.obtenerRegistro().subscribe((tc) => {
      this.tipoCambio.set(tc);
      if (tc?.tasa_cambio) this.nuevaTasa.set(tc.tasa_cambio);
    });
    this.tiendasService.findAll().subscribe((d) => this.tiendas.set(d));
    this.repartidoresService.findAll().subscribe((d) => this.repartidores.set(d));
    this.auth.findAllUsuarios().subscribe((d) => this.usuarios.set(d));
    this.pedidosService.findAll().subscribe((peds) => this.pedidos.set(peds));
    this.categoriasService.findAll().subscribe((d) => this.categorias.set(d));
    this.marcasService.findAll().subscribe((d) => this.marcas.set(d));
    this.fabricantesService.findAll().subscribe((d) => this.fabricantes.set(d));
  }

  // Aprobación de Solicitudes (Tiendas y Repartidores)
  aprobarTienda(tienda: Tienda) {
    this.tiendasService.aprobarTienda(tienda.id).subscribe(() => {
      this.mostrarAviso(`Tienda "${tienda.nombre}" verificada y cuenta de vendedor activada.`);
      this.cargarDatosAdmin();
    });
  }

  rechazarTienda(tienda: Tienda) {
    this.tiendasService.rechazarTienda(tienda.id).subscribe(() => {
      this.mostrarAviso(`Solicitud de la tienda "${tienda.nombre}" rechazada.`);
      this.cargarDatosAdmin();
    });
  }

  aprobarRepartidor(rep: Repartidor) {
    this.repartidoresService.aprobarRepartidor(rep.id).subscribe(() => {
      this.mostrarAviso(
        `Repartidor "${rep.usuario?.nombre_completo}" habilitado en la flota logística.`,
      );
      this.cargarDatosAdmin();
    });
  }

  rechazarRepartidor(rep: Repartidor) {
    this.repartidoresService.rechazarRepartidor(rep.id).subscribe(() => {
      this.mostrarAviso(`Solicitud del repartidor "${rep.usuario?.nombre_completo}" rechazada.`);
      this.cargarDatosAdmin();
    });
  }

  // Gestión de Aliados y Usuarios
  cambiarPlanTienda(tiendaId: string, plan: string) {
    this.tiendasService.actualizarPlan(tiendaId, plan).subscribe(() => {
      this.mostrarAviso(`Plan de suscripción actualizado a ${plan}.`);
      this.tiendasService.findAll().subscribe((d) => this.tiendas.set(d));
    });
  }

  cambiarEstadoUsuario(usuario: Usuario, estado: string) {
    this.auth.cambiarEstadoUsuario(usuario.id, estado).subscribe(() => {
      this.mostrarAviso(`Estado de cuenta de ${usuario.nombre_completo} cambiado a ${estado}.`);
      this.auth.findAllUsuarios().subscribe((d) => this.usuarios.set(d));
    });
  }

  // Catálogo Maestro
  crearCategoria() {
    if (!this.nuevaCategoriaNombre().trim()) return;
    this.categoriasService
      .crear({
        nombre: this.nuevaCategoriaNombre().trim(),
        icono: this.nuevaCategoriaIcono().trim() || undefined,
      })
      .subscribe(() => {
        this.mostrarAviso(`Categoría "${this.nuevaCategoriaNombre()}" agregada al catálogo.`);
        this.nuevaCategoriaNombre.set('');
        this.nuevaCategoriaIcono.set('');
        this.categoriasService.findAll().subscribe((d) => this.categorias.set(d));
      });
  }

  crearMarca() {
    if (!this.nuevaMarcaNombre().trim()) return;
    this.marcasService
      .crear({
        nombre: this.nuevaMarcaNombre().trim(),
        url_logo: this.nuevaMarcaLogo().trim() || undefined,
      })
      .subscribe(() => {
        this.mostrarAviso(`Marca "${this.nuevaMarcaNombre()}" registrada en el sistema.`);
        this.nuevaMarcaNombre.set('');
        this.nuevaMarcaLogo.set('');
        this.marcasService.findAll().subscribe((d) => this.marcas.set(d));
      });
  }

  crearFabricante() {
    if (!this.nuevoFabricanteNombre().trim()) return;
    this.fabricantesService
      .crear({
        nombre: this.nuevoFabricanteNombre().trim(),
        pais_origen: this.nuevoFabricanteOrigen().trim() || undefined,
      })
      .subscribe(() => {
        this.mostrarAviso(`Fabricante "${this.nuevoFabricanteNombre()}" incorporado.`);
        this.nuevoFabricanteNombre.set('');
        this.nuevoFabricanteOrigen.set('');
        this.fabricantesService.findAll().subscribe((d) => this.fabricantes.set(d));
      });
  }

  // Parámetros y Divisa
  guardarParametro(clave: string, valor: string) {
    this.parametrosService.actualizar(clave, valor).subscribe(() => {
      this.mostrarAviso(`Parámetro "${clave}" actualizado a ${valor}.`);
      this.parametroEditando.set(null);
      this.parametrosService.findAll().subscribe((d) => this.parametros.set(d));

      // Si el parámetro editado es la tasa de cambio de respaldo, sincronizar tipo de cambio oficial
      if (clave === 'TASA_CAMBIO_DOLAR_DEFECTO') {
        const num = parseFloat(valor);
        if (!isNaN(num) && num > 0) {
          this.tipoCambioService.actualizarTasa(num, 'Ajuste desde Parámetros').subscribe((tc) => {
            this.tipoCambio.set(tc);
            this.nuevaTasa.set(tc.tasa_cambio);
          });
        }
      }
    });
  }

  actualizarTasaManual() {
    this.tipoCambioService
      .actualizarTasa(Number(this.nuevaTasa()), 'Ajuste Manual Admin')
      .subscribe((tc) => {
        this.tipoCambio.set(tc);
        this.mostrarAviso(`Cotización actualizada a Bs ${tc.tasa_cambio} por $1 USD.`);
        // Refrescar lista de parámetros dinámicos para que TASA_CAMBIO_DOLAR_DEFECTO refleje el cambio
        this.parametrosService.findAll().subscribe((d) => this.parametros.set(d));
      });
  }

  sincronizarTasaExterna() {
    this.tipoCambioService.sincronizar().subscribe((tc) => {
      this.tipoCambio.set(tc);
      this.nuevaTasa.set(tc.tasa_cambio);
      this.mostrarAviso(`Sincronización cambiaria en vivo completada: Bs ${tc.tasa_cambio}.`);
      // Refrescar lista de parámetros dinámicos para que TASA_CAMBIO_DOLAR_DEFECTO refleje el cambio
      this.parametrosService.findAll().subscribe((d) => this.parametros.set(d));
    });
  }

  // Arbitraje Escrow
  resolverReembolso(pedidoId: string) {
    this.pedidosService.reembolsar(pedidoId).subscribe(() => {
      this.mostrarAviso(
        'Disputa resuelta: Fondos reembolsados al comprador y stock restaurado en tienda.',
      );
      this.cargarDatosAdmin();
    });
  }

  obtenerRolNombre(u: Usuario): string {
    if (!u.roles || u.roles.length === 0) return 'COMPRADOR';
    const r = u.roles[0];
    return typeof r === 'string' ? r : (r as any).nombre;
  }
}
