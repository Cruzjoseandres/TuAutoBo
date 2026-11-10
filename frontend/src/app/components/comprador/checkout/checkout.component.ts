import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as L from 'leaflet';
import {
  AuthService,
  RepuestosService,
  PedidosService,
  TipoCambioService,
  ToastService,
  UbicacionService,
  DireccionComprador,
  NavigationContextService,
} from '../../../services';
import { Repuesto, Pedido } from '../../../models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styles: [`
    :host ::ng-deep .apple-map-pin-container {
      background: transparent;
      border: none;
    }
  `],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  protected readonly ubicacion = inject(UbicacionService);
  protected readonly navContext = inject(NavigationContextService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly repuestosService = inject(RepuestosService);
  private readonly pedidosService = inject(PedidosService);
  private readonly tipoCambioService = inject(TipoCambioService);

  repuesto = signal<Repuesto | null>(null);
  cargando = signal<boolean>(true);
  cantidad = signal<number>(1);

  // Configuración de Entrega 100% en Maps (Estilo Uber / PedidosYa)
  tipoEntrega = signal<'DELIVERY_MOTO' | 'RETIRO_TIENDA'>('DELIVERY_MOTO');
  aliasUbicacion = signal<string>('Punto en Mapa');
  direccionEntrega = signal<string>('');
  referenciaEntrega = signal<string>('');
  latitudDestino = signal<number>(-17.7833);
  longitudDestino = signal<number>(-63.1821);
  tarifaEnvioBs = signal<number>(0);
  distanciaKm = signal<number>(0);
  obteniendoGps = signal<boolean>(false);

  // Instancia de Mapa Leaflet en Checkout
  private mapCheckout: L.Map | null = null;
  private markerTienda: L.Marker | null = null;
  private markerDestino: L.Marker | null = null;
  private lineaRuta: L.Polyline | null = null;

  // Moneda y Método de Pago
  monedaPago = signal<'BOB' | 'USD'>(this.navContext.contextoCatalogo().moneda || 'BOB');
  metodoPago = signal<'QR_SIMPLE' | 'TARJETA_DEBITO_CREDITO'>('QR_SIMPLE');
  tasaDolar = signal<number>(6.96);

  // Datos de Tarjeta (cuando selecciona Tarjeta)
  numeroTarjeta = signal<string>('');
  nombreTarjeta = signal<string>('');
  expiracionTarjeta = signal<string>('');
  cvvTarjeta = signal<string>('');

  // Estado del Pedido y Pago Escrow
  pedidoGenerado = signal<Pedido | null>(null);
  procesandoOrden = signal<boolean>(false);
  simulandoPago = signal<boolean>(false);
  pagoConfirmado = signal<boolean>(false);

  subtotalBs = computed(() => (this.repuesto()?.precio_bob || 0) * this.cantidad());
  envioAplicadoBs = computed(() =>
    this.tipoEntrega() === 'DELIVERY_MOTO' ? this.tarifaEnvioBs() : 0,
  );
  usoAppBs = signal<number>(2.0);
  totalPagarBs = computed(
    () => Math.round((this.subtotalBs() + this.envioAplicadoBs() + this.usoAppBs()) * 100) / 100,
  );
  totalPagarUsd = computed(
    () => Math.round((this.totalPagarBs() / this.tasaDolar()) * 100) / 100,
  );

  constructor() {
    // Sincronizar automáticamente cuando el usuario cambia o agrega una ubicación en el modal global
    effect(() => {
      const dirActiva = this.ubicacion.ubicacionActiva();
      if (dirActiva) {
        this.aplicarDireccionGuardada(dirActiva, false);
      }
    });
  }

  ngOnInit() {
    this.tipoCambioService.obtenerRegistro().subscribe((tc) => {
      if (tc?.tasa_cambio) this.tasaDolar.set(tc.tasa_cambio);
    });

    const qCant = Number(this.route.snapshot.queryParamMap.get('cantidad'));
    if (qCant > 0) {
      this.cantidad.set(qCant);
    }

    const dirActiva = this.ubicacion.ubicacionActiva();
    if (dirActiva) {
      this.aliasUbicacion.set(dirActiva.alias);
      this.direccionEntrega.set(dirActiva.direccion_escrita);
      this.referenciaEntrega.set(dirActiva.referencia || '');
      this.latitudDestino.set(dirActiva.latitud);
      this.longitudDestino.set(dirActiva.longitud);
    } else {
      this.geocodificarInversaCheckout(this.latitudDestino(), this.longitudDestino());
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.repuestosService.findById(id).subscribe({
        next: (rep) => {
          this.repuesto.set(rep);
          this.cargando.set(false);
          this.recalcularTarifaEnvio();
          setTimeout(() => {
            this.inicializarMapaCheckout();
          }, 150);
        },
        error: () => {
          this.router.navigate(['/comprador']);
        },
      });
    } else {
      this.router.navigate(['/comprador']);
    }
  }

  ngOnDestroy() {
    this.destruirMapaCheckout();
  }

  aplicarDireccionGuardada(dir: DireccionComprador, mostrarToast = true) {
    this.ubicacion.seleccionarUbicacion(dir);
    this.aliasUbicacion.set(dir.alias);
    this.direccionEntrega.set(dir.direccion_escrita);
    this.referenciaEntrega.set(dir.referencia || '');
    this.latitudDestino.set(dir.latitud);
    this.longitudDestino.set(dir.longitud);
    this.actualizarPinEnMapaCheckout(dir.latitud, dir.longitud, true);
    this.recalcularTarifaEnvio();
    if (mostrarToast) {
      this.toast.info(`Entrega en: ${dir.alias}`, dir.direccion_escrita);
    }
  }

  usarMiGpsEnCheckout() {
    if (!navigator.geolocation) {
      this.toast.advertencia('GPS no disponible', 'Tu navegador o dispositivo no soporta geolocalización.');
      return;
    }

    this.obteniendoGps.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.obteniendoGps.set(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.aliasUbicacion.set('Mi Ubicación GPS Actual');
        this.latitudDestino.set(lat);
        this.longitudDestino.set(lng);
        this.actualizarPinEnMapaCheckout(lat, lng, true);
        this.geocodificarInversaCheckout(lat, lng);
        this.recalcularTarifaEnvio();
        this.toast.exito('GPS Actualizado', 'Se fijó tu ubicación actual en el mapa de entrega.');
      },
      () => {
        this.obteniendoGps.set(false);
        this.toast.advertencia(
          'Permiso GPS requerido',
          'También puedes arrastrar el pin azul o tocar directamente en el mapa tu lugar de entrega.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  private inicializarMapaCheckout() {
    if (this.tipoEntrega() !== 'DELIVERY_MOTO') return;
    const el = document.getElementById('mapa-checkout-entrega');
    if (!el) return;

    this.destruirMapaCheckout();

    const rep = this.repuesto();
    const latTienda = rep?.tienda?.latitud ?? -17.7833;
    const lngTienda = rep?.tienda?.longitud ?? -63.1821;
    const latDest = this.latitudDestino();
    const lngDest = this.longitudDestino();

    this.mapCheckout = L.map('mapa-checkout-entrega', {
      zoomControl: true,
      attributionControl: false,
    }).setView([latDest, lngDest], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.mapCheckout);

    // Pin de la Tienda (Origen)
    const iconoTienda = L.divIcon({
      className: 'apple-map-pin-container',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 36px; height: 36px; transform: translate(-50%, -100%);">
          <div style="background: #10B981; color: white; border-radius: 9999px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16,185,129,0.45); border: 2px solid white; font-size: 14px;">
            🏪
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    // Pin del Comprador (Destino arrastrable)
    const iconoDestino = L.divIcon({
      className: 'apple-map-pin-container',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 40px; height: 40px; transform: translate(-50%, -100%);">
          <div style="background: #0071E3; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,113,227,0.5); border: 2.5px solid white;">
            <svg style="width: 17px; height: 17px;" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div style="width: 10px; height: 4px; background: rgba(0,0,0,0.35); border-radius: 9999px; margin-top: 2px;"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    this.markerTienda = L.marker([latTienda, lngTienda], { icon: iconoTienda })
      .addTo(this.mapCheckout)
      .bindPopup(`<b>Origen: ${rep?.tienda?.nombre || 'Tienda'}</b>`);

    this.markerDestino = L.marker([latDest, lngDest], {
      icon: iconoDestino,
      draggable: true,
    }).addTo(this.mapCheckout);

    this.lineaRuta = L.polyline(
      [
        [latTienda, lngTienda],
        [latDest, lngDest],
      ],
      {
        color: '#0071E3',
        weight: 3,
        dashArray: '6, 8',
        opacity: 0.85,
      },
    ).addTo(this.mapCheckout);

    // Ajustar encuadre para mostrar Tienda y Punto de Entrega
    const bounds = L.latLngBounds([
      [latTienda, lngTienda],
      [latDest, lngDest],
    ]);
    this.mapCheckout.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });

    // Eventos de arrastrar pin o tocar mapa
    this.markerDestino.on('dragend', () => {
      if (!this.markerDestino) return;
      const pos = this.markerDestino.getLatLng();
      this.alMoverPuntoEnMapa(pos.lat, pos.lng);
    });

    this.mapCheckout.on('click', (e: L.LeafletMouseEvent) => {
      this.alMoverPuntoEnMapa(e.latlng.lat, e.latlng.lng);
    });

    setTimeout(() => {
      this.mapCheckout?.invalidateSize();
    }, 250);
  }

  private alMoverPuntoEnMapa(lat: number, lng: number) {
    this.aliasUbicacion.set('Punto personalizado en Mapa');
    this.latitudDestino.set(lat);
    this.longitudDestino.set(lng);
    this.actualizarPinEnMapaCheckout(lat, lng, false);
    this.geocodificarInversaCheckout(lat, lng);
    this.recalcularTarifaEnvio();
  }

  private actualizarPinEnMapaCheckout(lat: number, lng: number, centrarVista: boolean) {
    if (!this.mapCheckout) return;
    if (this.markerDestino) {
      this.markerDestino.setLatLng([lat, lng]);
    }
    const rep = this.repuesto();
    const latTienda = rep?.tienda?.latitud ?? -17.7833;
    const lngTienda = rep?.tienda?.longitud ?? -63.1821;
    if (this.lineaRuta) {
      this.lineaRuta.setLatLngs([
        [latTienda, lngTienda],
        [lat, lng],
      ]);
    }
    if (centrarVista) {
      this.mapCheckout.flyTo([lat, lng], 15, { animate: true, duration: 0.8 });
    }
  }

  private geocodificarInversaCheckout(lat: number, lng: number) {
    const fallback = `Ubicación en Mapa (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'es' } },
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data.display_name) {
          const calle =
            data.address?.road ||
            data.address?.neighbourhood ||
            data.address?.suburb ||
            '';
          const barrio = data.address?.suburb || data.address?.neighbourhood || '';
          const ciudad = data.address?.city || data.address?.town || 'Santa Cruz de la Sierra';
          const partes = [calle, barrio && barrio !== calle ? barrio : '', ciudad].filter(Boolean);
          this.direccionEntrega.set(
            partes.length > 0 ? partes.join(', ') : data.display_name.split(',').slice(0, 3).join(','),
          );
        } else {
          this.direccionEntrega.set(fallback);
        }
      })
      .catch(() => {
        if (!this.direccionEntrega().trim()) {
          this.direccionEntrega.set(fallback);
        }
      });
  }

  private destruirMapaCheckout() {
    if (this.mapCheckout) {
      this.mapCheckout.remove();
      this.mapCheckout = null;
      this.markerTienda = null;
      this.markerDestino = null;
      this.lineaRuta = null;
    }
  }

  incrementarCantidad() {
    const rep = this.repuesto();
    const maxStock = rep ? (rep.stock_disponible || 10) : 10;
    if (this.cantidad() < maxStock) {
      this.cantidad.update((c) => c + 1);
      this.recalcularTarifaEnvio();
    } else {
      this.toast.info(`Stock máximo disponible alcanzado (${maxStock} unidades)`);
    }
  }

  decrementarCantidad() {
    if (this.cantidad() > 1) {
      this.cantidad.update((c) => c - 1);
      this.recalcularTarifaEnvio();
    }
  }

  cambiarTipoEntrega(tipo: 'DELIVERY_MOTO' | 'RETIRO_TIENDA') {
    this.tipoEntrega.set(tipo);
    if (tipo === 'DELIVERY_MOTO') {
      this.recalcularTarifaEnvio();
      setTimeout(() => {
        this.inicializarMapaCheckout();
      }, 100);
    } else {
      this.destruirMapaCheckout();
      this.tarifaEnvioBs.set(0);
    }
  }

  recalcularTarifaEnvio() {
    const rep = this.repuesto();
    if (!rep) return;

    this.pedidosService
      .cotizarEnvio({
        repuesto_id: rep.id,
        tipo_entrega: this.tipoEntrega(),
        latitud_entrega: this.latitudDestino(),
        longitud_entrega: this.longitudDestino(),
        cantidad: this.cantidad(),
      })
      .subscribe((res) => {
        this.tarifaEnvioBs.set(res.tarifa_envio_bs);
        if (res.distancia_km !== undefined) this.distanciaKm.set(res.distancia_km);
      });
  }

  generarOrdenEscrow() {
    const rep = this.repuesto();
    const user = this.auth.usuarioActual();
    if (!rep || !user) return;

    const coordsTexto = `(${this.latitudDestino().toFixed(4)}, ${this.longitudDestino().toFixed(4)})`;
    const calleDetectada =
      this.direccionEntrega().trim() || `Ubicación en Mapa ${coordsTexto}`;

    const direccionFinal =
      this.tipoEntrega() === 'RETIRO_TIENDA'
        ? 'Retiro personal en tienda repuestera'
        : [
            this.aliasUbicacion().trim() ? `[${this.aliasUbicacion().trim()}]` : '',
            calleDetectada,
            this.referenciaEntrega().trim() ? `Ref: ${this.referenciaEntrega().trim()}` : '',
          ]
            .filter(Boolean)
            .join(' — ');

    this.procesandoOrden.set(true);
    this.pedidosService
      .crearPedido({
        usuario_comprador_id: user.id,
        repuesto_id: rep.id,
        tipo_entrega: this.tipoEntrega(),
        moneda_pago: this.monedaPago(),
        metodo_pago: this.metodoPago(),
        cantidad: this.cantidad(),
        latitud_entrega: this.latitudDestino(),
        longitud_entrega: this.longitudDestino(),
        direccion_escrita: direccionFinal,
        referencia: this.referenciaEntrega().trim(),
      })
      .subscribe({
        next: (ped: Pedido) => {
          this.procesandoOrden.set(false);
          this.pedidoGenerado.set(ped);
          this.toast.info(`Orden ${ped.numero_orden} generada. Procediendo a custodia Escrow.`);
        },
        error: () => {
          this.procesandoOrden.set(false);
          this.toast.error('Error al generar la orden de compra.');
        },
      });
  }

  volver() {
    const id = this.repuesto()?.id;
    this.navContext.volver(id ? ['/comprador/repuesto', id] : ['/comprador', 'catalogo']);
  }

  irAMisPedidos() {
    this.router.navigate(['/comprador', 'pedidos'], { replaceUrl: true });
  }

  confirmarPagoEscrow() {
    const ped = this.pedidoGenerado();
    if (!ped) return;

    this.simulandoPago.set(true);
    setTimeout(() => {
      this.pedidosService
        .confirmarPago(ped.id, `AUTH-QR-${Date.now().toString().slice(-6)}`)
        .subscribe((actualizado: Pedido) => {
          this.pedidoGenerado.set(actualizado);
          this.simulandoPago.set(false);
          this.pagoConfirmado.set(true);
          this.toast.exito('¡Pago completado! Fondos retenidos en Custodia Escrow.');
        });
    }, 900);
  }
}
