import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import {
  AuthService,
  RepartidoresService,
  PedidosService,
  ToastService,
  NavigationContextService,
} from '../../services';
import { Repartidor, Pedido } from '../../models';
import { CustomSelectComponent, SelectOption } from '../shared/custom-select.component';

type TabRepartidor = 'disponibles' | 'en-curso' | 'historial';

@Component({
  selector: 'app-repartidor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CustomSelectComponent],
  templateUrl: './repartidor.component.html',
})
export class RepartidorComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly navContext = inject(NavigationContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly repartidoresService = inject(RepartidoresService);
  private readonly pedidosService = inject(PedidosService);
  private readonly toast = inject(ToastService);

  cargando = signal<boolean>(false);
  tabActiva = signal<TabRepartidor>('disponibles');

  perfil = signal<Repartidor | null>(null);
  carrerasDisponibles = signal<Pedido[]>([]);
  miPedidoEnCurso = signal<Pedido | null>(null);
  historialCarreras = signal<Pedido[]>([]);

  totalGanadoHistorialBs = computed(() =>
    this.historialCarreras().reduce((sum, p) => sum + Number(p.tarifa_envio_bs || 0), 0)
  );

  pinEntrega = signal<string>('');
  errorPin = signal<string | null>(null);

  // Modal y controles de capacidad (mínima, máxima y tamaño)
  modalCapacidadAbierto = signal<boolean>(false);
  capacidadMin = signal<number>(0.1);
  capacidadMax = signal<number>(20.0);
  tamanoMaximo = signal<string>('MEDIANO');
  guardandoCapacidad = signal<boolean>(false);

  opcionesTamano: SelectOption[] = [
    { valor: 'PEQUENO', etiqueta: 'PEQUEÑO (Mochila Moto / Paquetes Chicos)' },
    { valor: 'MEDIANO', etiqueta: 'MEDIANO (Parrilla Moto / Baúl Auto)' },
    { valor: 'GRANDE', etiqueta: 'GRANDE (Camioneta / Maletero Amplio)' },
  ];

  ngOnInit() {
    this.cargarPerfilRepartidor();

    const unregisterModalCapacidad = this.navContext.registrarCerradorModal(() => {
      if (this.modalCapacidadAbierto()) {
        this.modalCapacidadAbierto.set(false);
        return true;
      }
      return false;
    });
    this.destroyRef.onDestroy(() => unregisterModalCapacidad());

    // Sincronización de ruta activa /repartidor/:tab y refresco en demanda
    this.route.paramMap.subscribe((params) => {
      const tab = params.get('tab') as TabRepartidor;
      if (tab && ['disponibles', 'en-curso', 'historial'].includes(tab)) {
        this.tabActiva.set(tab);
        const rep = this.perfil();
        if (rep) {
          this.refrescarPorTab(tab, rep.id);
        }
      }
    });
  }

  refrescarPorTab(tab: TabRepartidor, repartidorId: string) {
    switch (tab) {
      case 'disponibles':
        this.cargarPedidosDisponibles(repartidorId);
        break;
      case 'en-curso':
        this.cargarPedidoEnCurso(repartidorId);
        break;
      case 'historial':
        this.cargarHistorial(repartidorId);
        break;
      default:
        this.cargarPedidosDisponibles(repartidorId);
        break;
    }
  }

  refrescarManual() {
    const rep = this.perfil();
    if (!rep) return;
    this.cargando.set(true);
    this.refrescarPorTab(this.tabActiva(), rep.id);
    setTimeout(() => {
      this.cargando.set(false);
      this.toast.info('Bolsa de despachos sincronizada en tiempo real.');
    }, 400);
  }

  cargarPerfilRepartidor() {
    this.repartidoresService.findAll().subscribe((repartidores) => {
      const user = this.auth.usuarioActual();
      const rep = user
        ? (repartidores.find((r) => r.usuario_id === user.id) || null)
        : null;

      this.perfil.set(rep);
      if (rep) {
        this.capacidadMin.set(rep.capacidad_peso_min_kg);
        this.capacidadMax.set(rep.capacidad_peso_max_kg);
        this.tamanoMaximo.set(rep.tamano_maximo);

        // Cargar datos de la tab actual y verificar si tiene carrera en curso
        this.refrescarPorTab(this.tabActiva(), rep.id);
        this.cargarPedidoEnCurso(rep.id);
      }
    });
  }

  cargarPedidoEnCurso(repartidorId: string) {
    this.pedidosService.findByRepartidorId(repartidorId).subscribe((peds) => {
      const estadosActivos = [
        'EN_CAMINO_A_TIENDA',
        'EN_TIENDA',
        'EN_CAMINO_A_DESTINO',
        'EN_DESTINO',
        'EN_CAMINO',
      ];
      const activo = peds.find((p) => estadosActivos.includes(p.estado)) || null;
      this.miPedidoEnCurso.set(activo);
    });
  }

  posicionRepartidor = signal<{ lat: number; lon: number } | null>(null);

  obtenerUbicacionActual(): Promise<{ lat: number; lon: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          this.posicionRepartidor.set(coords);
          resolve(coords);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  }

  async cargarPedidosDisponibles(repartidorId: string) {
    const coords = await this.obtenerUbicacionActual();
    this.pedidosService
      .obtenerDisponiblesParaRepartidor(repartidorId, coords?.lat, coords?.lon)
      .subscribe((peds) => {
        this.carrerasDisponibles.set(peds);
      });
  }

  avanzarPaso(pedido: Pedido, nuevoEstado: string) {
    const rep = this.perfil();
    if (!rep) return;

    this.cargando.set(true);
    this.pedidosService.avanzarEstadoRepartidor(pedido.id, rep.id, nuevoEstado).subscribe({
      next: (actualizado) => {
        this.cargando.set(false);
        this.miPedidoEnCurso.set(actualizado);

        if (nuevoEstado === 'EN_TIENDA') {
          this.toast.info('¡Llegaste al local! Notificando al encargado de la repuestera.');
        } else if (nuevoEstado === 'EN_CAMINO_A_DESTINO' || nuevoEstado === 'EN_CAMINO') {
          this.toast.exito('¡Paquete a bordo! Dirígete hacia la ubicación del comprador.');
        } else if (nuevoEstado === 'EN_DESTINO') {
          this.toast.info('¡Llegaste al destino! Solicita el PIN de 4 dígitos al cliente.');
        }
      },
      error: (err) => {
        this.cargando.set(false);
        this.toast.error(err?.error?.message || 'Error al cambiar estado del viaje.');
      },
    });
  }

  abrirEnGoogleMaps(lat?: number | null, lon?: number | null) {
    if (!lat || !lon) {
      this.toast.error('Coordenadas no disponibles para este punto.');
      return;
    }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
  }

  abrirEnWaze(lat?: number | null, lon?: number | null) {
    if (!lat || !lon) {
      this.toast.error('Coordenadas no disponibles para este punto.');
      return;
    }
    window.open(`https://waze.com/ul?ll=${lat},${lon}&navigate=yes`, '_blank');
  }

  cargarHistorial(repartidorId: string) {
    this.pedidosService.findByRepartidorId(repartidorId).subscribe((peds) => {
      const completados = peds.filter((p) => p.estado === 'COMPLETADO');
      this.historialCarreras.set(completados);
    });
  }

  toggleTurno() {
    const rep = this.perfil();
    if (!rep) return;
    const nuevoEstado = !rep.esta_activo;
    this.repartidoresService.cambiarEstadoActivo(rep.id, nuevoEstado).subscribe((act) => {
      this.perfil.set(act);
      this.toast.info(nuevoEstado ? 'Turno iniciado. Buscando despachos...' : 'Turno pausado.');
    });
  }

  guardarCapacidad() {
    const rep = this.perfil();
    if (!rep) return;

    this.guardandoCapacidad.set(true);
    this.repartidoresService
      .actualizarCapacidad(
        rep.id,
        this.capacidadMin(),
        this.capacidadMax(),
        this.tamanoMaximo(),
      )
      .subscribe({
        next: (actualizado) => {
          this.guardandoCapacidad.set(false);
          this.perfil.set(actualizado);
          this.modalCapacidadAbierto.set(false);
          this.toast.exito('Capacidades logísticas actualizadas exitosamente.');
          this.cargarPedidosDisponibles(actualizado.id);
        },
        error: () => {
          this.guardandoCapacidad.set(false);
          this.toast.error('No se pudo guardar la capacidad.');
        },
      });
  }

  aceptarCarrera(pedido: Pedido) {
    const rep = this.perfil();
    if (!rep) return;

    this.pedidosService.asignarRepartidor(pedido.id, rep.id).subscribe((pedAsignado) => {
      this.miPedidoEnCurso.set(pedAsignado);
      this.tabActiva.set('en-curso');
      this.cargarPedidosDisponibles(rep.id);
      this.toast.exito(`¡Carrera asignada! Dirígete a ${pedido.tienda?.nombre} para recoger la pieza.`);
    });
  }

  validarPinYFinalizar(pedido: Pedido) {
    this.errorPin.set(null);
    this.pedidosService.confirmarEntregaPin(pedido.id, this.pinEntrega()).subscribe({
      next: () => {
        this.toast.exito('¡Entrega completada! Fondos liberados y flete acreditado a tu billetera.');
        this.miPedidoEnCurso.set(null);
        this.pinEntrega.set('');
        if (this.perfil()) {
          this.cargarPedidosDisponibles(this.perfil()!.id);
          this.cargarHistorial(this.perfil()!.id);
        }
      },
      error: (err) => {
        const msg = err?.error?.message || 'El PIN de 4 dígitos es incorrecto.';
        this.errorPin.set(msg);
        this.toast.error(msg);
      },
    });
  }
}
