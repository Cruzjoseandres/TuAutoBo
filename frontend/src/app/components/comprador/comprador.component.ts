import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
  AuthService,
  MarcasService,
  ModelosService,
  VehiculosService,
  CategoriasService,
  RepuestosService,
  PedidosService,
  TipoCambioService,
  UbicacionService,
} from '../../services';
import {
  Marca,
  Modelo,
  Vehiculo,
  Categoria,
  Repuesto,
  Pedido,
} from '../../models';
import { CustomSelectComponent, SelectOption } from '../shared/custom-select.component';

@Component({
  selector: 'app-comprador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CustomSelectComponent],
  templateUrl: './comprador.component.html',
})
export class CompradorComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly ubicacion = inject(UbicacionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly marcasService = inject(MarcasService);
  private readonly modelosService = inject(ModelosService);
  private readonly vehiculosService = inject(VehiculosService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly repuestosService = inject(RepuestosService);
  private readonly pedidosService = inject(PedidosService);
  private readonly tipoCambioService = inject(TipoCambioService);

  // Pestañas del comprador
  seccionActiva = signal<'catalogo' | 'pedidos'>('catalogo');

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
    this.cargarDatos();

    // Sincronización de ruta activa /comprador/:tab y refresco en demanda
    this.route.paramMap.subscribe((params) => {
      const tab = params.get('tab') as any;
      if (tab && ['catalogo', 'pedidos'].includes(tab)) {
        this.seccionActiva.set(tab);
        if (tab === 'pedidos') {
          this.cargarMisPedidos();
        } else if (tab === 'catalogo') {
          this.cargarRepuestos();
        }
      }
    });
  }

  refrescarManual() {
    this.cargandoManual.set(true);
    if (this.seccionActiva() === 'pedidos') {
      this.cargarMisPedidos();
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
  }

  seleccionarCategoria(id: number | null) {
    this.categoriaId.set(id);
    this.paginaActual.set(1);
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
    this.cargarRepuestos();
  }

  onClearVehiculo() {
    this.vehiculoSeleccionado.set(null);
    this.marcaTemp.set(null);
    this.modeloTemp.set(null);
    this.paginaActual.set(1);
    this.cargarRepuestos();
  }

  toggleMoneda() {
    this.moneda.set(this.moneda() === 'BOB' ? 'USD' : 'BOB');
  }

  formatearPrecio(bob: number, usd: number): string {
    return this.moneda() === 'BOB' ? `Bs ${bob.toFixed(2)}` : `$ ${usd.toFixed(2)} USD`;
  }

  verDetalleRepuesto(rep: Repuesto) {
    this.router.navigate(['/comprador/repuesto', rep.id]);
  }

  irAPagarDirecto(rep: Repuesto, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/comprador/checkout', rep.id]);
  }
}
