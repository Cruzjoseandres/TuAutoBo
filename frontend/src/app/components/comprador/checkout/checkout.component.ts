import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AuthService,
  RepuestosService,
  PedidosService,
  TipoCambioService,
  ToastService,
  UbicacionService,
} from '../../../services';
import { Repuesto, Pedido } from '../../../models';
import { CustomSelectComponent, SelectOption } from '../../shared/custom-select.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CustomSelectComponent],
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly ubicacion = inject(UbicacionService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly repuestosService = inject(RepuestosService);
  private readonly pedidosService = inject(PedidosService);
  private readonly tipoCambioService = inject(TipoCambioService);

  repuesto = signal<Repuesto | null>(null);
  cargando = signal<boolean>(true);
  cantidad = signal<number>(1);

  // Configuración de Entrega (Estilo PedidosYa)
  tipoEntrega = signal<'DELIVERY_MOTO' | 'RETIRO_TIENDA'>('DELIVERY_MOTO');
  zonaEntrega = signal<string>('');
  direccionEntrega = signal<string>('');
  referenciaEntrega = signal<string>('');
  latitudDestino = signal<number>(-17.7833);
  longitudDestino = signal<number>(-63.1821);
  tarifaEnvioBs = signal<number>(0);
  distanciaKm = signal<number>(0);

  // Moneda y Método de Pago
  monedaPago = signal<'BOB' | 'USD'>('BOB');
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

  zonasSantaCruz = [
    { nombre: '1er y 2do Anillo (Casco Viejo / Siete Calles)', lat: -17.7833, lng: -63.1821 },
    { nombre: '3er Anillo Interno / Equipetrol', lat: -17.7685, lng: -63.1952 },
    { nombre: '4to Anillo Norte (Av. Banzer / Remanso)', lat: -17.745, lng: -63.176 },
    { nombre: '4to Anillo Sur (Av. Santos Dumont / Doble Vía)', lat: -17.818, lng: -63.192 },
    { nombre: 'Urubó / Porongo (Puente Foianini)', lat: -17.752, lng: -63.218 },
  ];

  opcionesZonas: SelectOption[] = [
    { valor: '1er y 2do Anillo (Casco Viejo / Siete Calles)', etiqueta: '1er y 2do Anillo (Casco Viejo)' },
    { valor: '3er Anillo Interno / Equipetrol', etiqueta: '3er Anillo / Equipetrol' },
    { valor: '4to Anillo Norte (Av. Banzer / Remanso)', etiqueta: '4to Anillo Norte (Banzer)' },
    { valor: '4to Anillo Sur (Av. Santos Dumont / Doble Vía)', etiqueta: '4to Anillo Sur (Doble Vía)' },
    { valor: 'Urubó / Porongo (Puente Foianini)', etiqueta: 'Urubó / Porongo' },
  ];

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
      this.zonaEntrega.set(dirActiva.alias);
      this.direccionEntrega.set(dirActiva.direccion_escrita);
      this.referenciaEntrega.set(dirActiva.referencia || '');
      this.latitudDestino.set(dirActiva.latitud);
      this.longitudDestino.set(dirActiva.longitud);
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.repuestosService.findById(id).subscribe({
        next: (rep) => {
          this.repuesto.set(rep);
          this.cargando.set(false);
          this.recalcularTarifaEnvio();
        },
        error: () => {
          this.router.navigate(['/comprador']);
        },
      });
    } else {
      this.router.navigate(['/comprador']);
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

  seleccionarZona(zonaNombre: string) {
    this.zonaEntrega.set(zonaNombre);
    const encontrada = this.zonasSantaCruz.find((z) => z.nombre === zonaNombre);
    if (encontrada) {
      this.latitudDestino.set(encontrada.lat);
      this.longitudDestino.set(encontrada.lng);
      this.recalcularTarifaEnvio();
    }
  }

  cambiarTipoEntrega(tipo: 'DELIVERY_MOTO' | 'RETIRO_TIENDA') {
    this.tipoEntrega.set(tipo);
    if (tipo === 'DELIVERY_MOTO') {
      this.recalcularTarifaEnvio();
    } else {
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
        if (res.distancia_km) this.distanciaKm.set(res.distancia_km);
      });
  }

  generarOrdenEscrow() {
    const rep = this.repuesto();
    const user = this.auth.usuarioActual();
    if (!rep || !user) return;

    if (this.tipoEntrega() === 'DELIVERY_MOTO') {
      if (!this.direccionEntrega().trim() && !this.zonaEntrega().trim()) {
        this.toast.error('Por favor selecciona una dirección de entrega en Santa Cruz para el despacho en moto.');
        return;
      }
    }

    const direccionFinal =
      this.tipoEntrega() === 'RETIRO_TIENDA'
        ? 'Retiro personal en tienda repuestera'
        : [
            this.direccionEntrega().trim(),
            this.zonaEntrega().trim() ? `(${this.zonaEntrega().trim()})` : '',
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
