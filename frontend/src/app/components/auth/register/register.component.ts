import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import {
  AuthService,
  TiendasService,
  RepartidoresService,
  TiposVehiculoService,
  ThemeService,
} from '../../../services';
import { TipoVehiculo, TipoVehiculoEnum, TamanoRepuestoEnum } from '../../../models';
import { formatearErrorHttp } from '../../../utils/error-formatter';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit, OnDestroy {
  protected readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly tiendasService = inject(TiendasService);
  private readonly repartidoresService = inject(RepartidoresService);
  private readonly tiposVehiculoService = inject(TiposVehiculoService);
  private readonly router = inject(Router);

  // Tipo de registro: 'comprador' (directo) | 'aliado' (requiere validación)
  modoRegistro = signal<'comprador' | 'aliado'>('comprador');
  tipoAliado = signal<'VENDEDOR' | 'REPARTIDOR'>('VENDEDOR');

  // Datos comunes de cuenta
  nombreCompleto = signal('');
  correo = signal('');
  numeroCelular = signal('');
  telefono = computed(() => {
    const num = this.numeroCelular().trim();
    return num ? `+591 ${num}` : '';
  });
  clave = signal('');

  // Aceptación de Políticas y Condiciones
  aceptaTerminos = signal(false);

  // Datos exclusivos Solicitud Tienda Repuestera o Taller Mecánico (VENDEDOR)
  tipoEstablecimiento = signal<'TIENDA_REPUESTOS' | 'TALLER_MECANICO' | 'REPUESTERA_Y_TALLER'>('TIENDA_REPUESTOS');
  nombreTienda = signal('');
  nitTienda = signal('');
  direccionTienda = signal('');
  referenciaTienda = signal('');
  horarioTienda = signal('');
  especialidadTienda = signal('');
  serviciosTaller = signal('');

  // Mapa Interactivo para fijar Ubicación Física de la Tienda / Taller
  private mapaTienda: L.Map | null = null;
  private markerTienda: L.Marker | null = null;
  latitudTienda = signal<number>(-17.7833);
  longitudTienda = signal<number>(-63.1821);
  obteniendoGpsTienda = signal<boolean>(false);

  // Catálogo dinámico de Tipos de Vehículo obtenido desde la Base de Datos
  tiposVehiculo = signal<TipoVehiculo[]>([]);
  tipoVehiculoSeleccionado = signal<TipoVehiculo | null>(null);

  // Datos exclusivos Solicitud Repartidor (REPARTIDOR)
  placaVehiculo = signal('');
  licenciaConducir = signal('');

  // Capacidades dinámicas calculadas desde el vehículo seleccionado
  pesoMinKg = computed(() => this.tipoVehiculoSeleccionado()?.peso_min_kg ?? 0.1);
  pesoMaxKg = computed(() => this.tipoVehiculoSeleccionado()?.peso_max_kg ?? 20.0);
  tamanoMaximo = computed(() => this.tipoVehiculoSeleccionado()?.tamano_maximo ?? TamanoRepuestoEnum.PEQUENO);

  // Estados de UI y validaciones inline
  cargando = signal(false);
  solicitudEnviada = signal(false);

  // Errores individuales por campo (inline directamente debajo de cada input)
  errorNombre = signal<string | null>(null);
  errorTelefono = signal<string | null>(null);
  errorCorreo = signal<string | null>(null);
  errorClave = signal<string | null>(null);

  // Errores específicos de Tienda / Taller
  errorNombreTienda = signal<string | null>(null);
  errorNitTienda = signal<string | null>(null);
  errorDireccionTienda = signal<string | null>(null);

  // Errores específicos de Repartidor
  errorPlaca = signal<string | null>(null);
  errorLicencia = signal<string | null>(null);
  errorTerminos = signal<string | null>(null);

  // Banner superior reservado estrictamente para respuestas del servidor (409 conflict, 500 error, 0 sin red)
  errorGeneral = signal<string | null>(null);

  ngOnInit() {
    this.cargarTiposVehiculo();
  }

  cargarTiposVehiculo() {
    this.tiposVehiculoService.findAll().subscribe({
      next: (tipos) => {
        this.tiposVehiculo.set(tipos);
        if (tipos.length > 0 && !this.tipoVehiculoSeleccionado()) {
          this.tipoVehiculoSeleccionado.set(tipos[0]);
        }
      },
      error: () => {
        // Fallback inicial si la BD está en proceso de sincronización
        const fallback: TipoVehiculo[] = [
          {
            id: 1,
            codigo: 'MOTOCICLETA',
            nombre: 'Motocicleta Express',
            descripcion: 'Hasta 20 kg • Paquetes pequeños',
            peso_min_kg: 0.1,
            peso_max_kg: 20.0,
            tamano_maximo: TamanoRepuestoEnum.PEQUENO,
            tarifa_base_bs: 10.0,
            precio_km_adicional_bs: 2.0,
            icono_svg: 'moto',
            orden_visual: 1,
            esta_activo: true,
          },
          {
            id: 2,
            codigo: 'TORITO_MOTOCARRO',
            nombre: 'Torito / Moto',
            descripcion: 'Hasta 60 kg • Paquetes medianos',
            peso_min_kg: 0.5,
            peso_max_kg: 60.0,
            tamano_maximo: TamanoRepuestoEnum.MEDIANO,
            tarifa_base_bs: 15.0,
            precio_km_adicional_bs: 2.5,
            icono_svg: 'torito',
            orden_visual: 2,
            esta_activo: true,
          },
          {
            id: 3,
            codigo: 'AUTOMOVIL',
            nombre: 'Automóvil',
            descripcion: 'Hasta 80 kg • Paquetes grandes',
            peso_min_kg: 0.5,
            peso_max_kg: 80.0,
            tamano_maximo: TamanoRepuestoEnum.GRANDE,
            tarifa_base_bs: 20.0,
            precio_km_adicional_bs: 3.0,
            icono_svg: 'auto',
            orden_visual: 3,
            esta_activo: true,
          },
          {
            id: 4,
            codigo: 'CAMIONETA',
            nombre: 'Camioneta',
            descripcion: 'Hasta 250 kg • Carga pesada',
            peso_min_kg: 1.0,
            peso_max_kg: 250.0,
            tamano_maximo: TamanoRepuestoEnum.GRANDE,
            tarifa_base_bs: 35.0,
            precio_km_adicional_bs: 4.0,
            icono_svg: 'camioneta',
            orden_visual: 4,
            esta_activo: true,
          },
        ];
        this.tiposVehiculo.set(fallback);
        this.tipoVehiculoSeleccionado.set(fallback[0]);
      },
    });
  }

  seleccionarVehiculo(v: TipoVehiculo) {
    this.tipoVehiculoSeleccionado.set(v);
  }

  // Limpieza reactiva al escribir
  onNombreChange(val: string) {
    this.nombreCompleto.set(val);
    if (this.errorNombre()) this.errorNombre.set(null);
  }

  onNumeroCelularInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let raw = input.value.replace(/\D/g, '');
    if (raw.startsWith('591') && raw.length > 3) {
      raw = raw.substring(3);
    }
    raw = raw.slice(0, 8);
    input.value = raw;
    this.numeroCelular.set(raw);
    if (this.errorTelefono()) this.errorTelefono.set(null);
  }

  onCorreoChange(val: string) {
    this.correo.set(val);
    if (this.errorCorreo()) this.errorCorreo.set(null);
  }

  onClaveChange(val: string) {
    this.clave.set(val);
    if (this.errorClave()) this.errorClave.set(null);
  }

  onNombreTiendaChange(val: string) {
    this.nombreTienda.set(val);
    if (this.errorNombreTienda()) this.errorNombreTienda.set(null);
  }

  onNitTiendaChange(val: string) {
    this.nitTienda.set(val);
    if (this.errorNitTienda()) this.errorNitTienda.set(null);
  }

  onDireccionTiendaChange(val: string) {
    this.direccionTienda.set(val);
    if (this.errorDireccionTienda()) this.errorDireccionTienda.set(null);
  }

  onPlacaChange(val: string) {
    this.placaVehiculo.set(val);
    if (this.errorPlaca()) this.errorPlaca.set(null);
  }

  onLicenciaChange(val: string) {
    this.licenciaConducir.set(val);
    if (this.errorLicencia()) this.errorLicencia.set(null);
  }

  onAceptaTerminosChange(val: boolean) {
    this.aceptaTerminos.set(val);
    if (this.errorTerminos()) this.errorTerminos.set(null);
  }

  limpiarErrores() {
    this.errorNombre.set(null);
    this.errorTelefono.set(null);
    this.errorCorreo.set(null);
    this.errorClave.set(null);
    this.errorNombreTienda.set(null);
    this.errorNitTienda.set(null);
    this.errorDireccionTienda.set(null);
    this.errorPlaca.set(null);
    this.errorLicencia.set(null);
    this.errorTerminos.set(null);
    this.errorGeneral.set(null);
  }

  activarModoAliado(tipo: 'VENDEDOR' | 'REPARTIDOR' = 'VENDEDOR') {
    this.modoRegistro.set('aliado');
    this.tipoAliado.set(tipo);
    this.limpiarErrores();
    this.solicitudEnviada.set(false);
    if (tipo === 'VENDEDOR') {
      this.inicializarMapaTienda();
    } else {
      this.destruirMapaTienda();
    }
  }

  activarModoComprador() {
    this.modoRegistro.set('comprador');
    this.limpiarErrores();
    this.solicitudEnviada.set(false);
    this.destruirMapaTienda();
  }

  inicializarMapaTienda() {
    setTimeout(() => {
      const el = document.getElementById('mapa-tienda');
      if (!el) return;

      if (this.mapaTienda) {
        this.mapaTienda.remove();
        this.mapaTienda = null;
      }

      const defaultLat = this.latitudTienda();
      const defaultLng = this.longitudTienda();

      this.mapaTienda = L.map('mapa-tienda', {
        zoomControl: true,
        attributionControl: false,
      }).setView([defaultLat, defaultLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(this.mapaTienda);

      const pinIcon = L.divIcon({
        className: 'apple-map-pin-container',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 36px; height: 36px; transform: translate(-50%, -100%);">
            <div style="background: #0071E3; color: white; border-radius: 9999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,113,227,0.45); border: 2.5px solid white;">
              <svg style="width: 16px; height: 16px;" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div style="width: 8px; height: 3px; background: rgba(0,0,0,0.3); border-radius: 9999px; margin-top: 2px; filter: blur(1px);"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      this.markerTienda = L.marker([defaultLat, defaultLng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(this.mapaTienda);

      this.markerTienda.on('dragend', () => {
        if (!this.markerTienda) return;
        const pos = this.markerTienda.getLatLng();
        this.actualizarCoordenadasTienda(pos.lat, pos.lng);
      });

      this.mapaTienda.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (this.markerTienda) {
          this.markerTienda.setLatLng([lat, lng]);
        }
        this.actualizarCoordenadasTienda(lat, lng);
      });

      setTimeout(() => {
        this.mapaTienda?.invalidateSize();
      }, 250);
    }, 150);
  }

  private actualizarCoordenadasTienda(lat: number, lng: number) {
    this.latitudTienda.set(lat);
    this.longitudTienda.set(lng);
    this.consultarGeocodificacionInversaTienda(lat, lng);
  }

  usarUbicacionActualTienda() {
    if (!navigator.geolocation) return;
    this.obteniendoGpsTienda.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.obteniendoGpsTienda.set(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.latitudTienda.set(lat);
        this.longitudTienda.set(lng);
        if (this.mapaTienda && this.markerTienda) {
          this.markerTienda.setLatLng([lat, lng]);
          this.mapaTienda.flyTo([lat, lng], 16, { animate: true, duration: 1 });
        }
        this.consultarGeocodificacionInversaTienda(lat, lng);
      },
      () => {
        this.obteniendoGpsTienda.set(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  private consultarGeocodificacionInversaTienda(lat: number, lng: number) {
    if (!this.direccionTienda().trim()) {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': 'es' },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.display_name && !this.direccionTienda().trim()) {
            const calle = data.address?.road || data.address?.neighbourhood || data.address?.suburb || '';
            const ciudad = data.address?.city || 'Santa Cruz de la Sierra';
            const sugerencia = calle ? `${calle}, ${ciudad}` : data.display_name.split(',').slice(0, 3).join(',');
            this.direccionTienda.set(sugerencia);
          }
        })
        .catch(() => {});
    }
  }

  destruirMapaTienda() {
    if (this.mapaTienda) {
      this.mapaTienda.remove();
      this.mapaTienda = null;
      this.markerTienda = null;
    }
  }

  validarComprador(): boolean {
    let valido = true;
    this.errorGeneral.set(null);

    if (!this.nombreCompleto().trim()) {
      this.errorNombre.set('El nombre completo es obligatorio.');
      valido = false;
    } else {
      this.errorNombre.set(null);
    }

    const celular = this.numeroCelular().trim();
    if (!celular) {
      this.errorTelefono.set('El número de celular es obligatorio.');
      valido = false;
    } else if (celular.length !== 8) {
      this.errorTelefono.set('El número de celular debe tener exactamente 8 dígitos.');
      valido = false;
    } else {
      this.errorTelefono.set(null);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const email = this.correo().trim();
    if (!email) {
      this.errorCorreo.set('El correo electrónico es obligatorio.');
      valido = false;
    } else if (!emailRegex.test(email)) {
      this.errorCorreo.set('Ingresa un correo electrónico con formato válido (ej. usuario@gmail.com).');
      valido = false;
    } else {
      this.errorCorreo.set(null);
    }

    const password = this.clave();
    if (!password) {
      this.errorClave.set('La contraseña es obligatoria.');
      valido = false;
    } else if (password.length < 6) {
      this.errorClave.set('La contraseña debe tener al menos 6 caracteres.');
      valido = false;
    } else {
      this.errorClave.set(null);
    }

    return valido;
  }

  registrarComprador() {
    if (!this.validarComprador()) {
      return;
    }

    this.cargando.set(true);
    this.errorGeneral.set(null);

    this.auth
      .registrarComprador({
        nombre_completo: this.nombreCompleto().trim(),
        correo: this.correo().trim(),
        telefono: this.telefono(),
        clave: this.clave(),
        ciudad_zona: 'Santa Cruz de la Sierra',
      })
      .subscribe({
        next: () => {
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          const msg = formatearErrorHttp(err, 'No se pudo completar el registro.');
          if (err?.status === 409 || msg.toLowerCase().includes('registrado') || msg.toLowerCase().includes('correo')) {
            this.errorCorreo.set('Este correo electrónico ya está registrado. Inicia sesión o utiliza otro.');
            this.errorGeneral.set('El correo electrónico ya se encuentra registrado.');
          } else {
            this.errorGeneral.set(msg);
          }
        },
      });
  }

  validarAliado(): boolean {
    let valido = true;
    this.errorGeneral.set(null);

    // Titular
    if (!this.nombreCompleto().trim()) {
      this.errorNombre.set('El nombre completo del titular es obligatorio.');
      valido = false;
    } else {
      this.errorNombre.set(null);
    }

    const celular = this.numeroCelular().trim();
    if (!celular) {
      this.errorTelefono.set('El número de celular es obligatorio.');
      valido = false;
    } else if (celular.length !== 8) {
      this.errorTelefono.set('El número de celular debe tener exactamente 8 dígitos.');
      valido = false;
    } else {
      this.errorTelefono.set(null);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const email = this.correo().trim();
    if (!email) {
      this.errorCorreo.set('El correo de acceso es obligatorio.');
      valido = false;
    } else if (!emailRegex.test(email)) {
      this.errorCorreo.set('Ingresa un correo electrónico con formato válido (ej. usuario@gmail.com).');
      valido = false;
    } else {
      this.errorCorreo.set(null);
    }

    const password = this.clave();
    if (!password) {
      this.errorClave.set('La contraseña es obligatoria.');
      valido = false;
    } else if (password.length < 6) {
      this.errorClave.set('La contraseña debe tener al menos 6 caracteres.');
      valido = false;
    } else {
      this.errorClave.set(null);
    }

    // Tienda / Taller
    if (this.tipoAliado() === 'VENDEDOR') {
      if (!this.nombreTienda().trim()) {
        const esTaller = this.tipoEstablecimiento() === 'TALLER_MECANICO';
        this.errorNombreTienda.set(esTaller ? 'El nombre comercial del taller es obligatorio.' : 'El nombre comercial de la repuestera es obligatorio.');
        valido = false;
      } else {
        this.errorNombreTienda.set(null);
      }

      if (!this.nitTienda().trim()) {
        this.errorNitTienda.set('El NIT o padrón municipal es obligatorio.');
        valido = false;
      } else {
        this.errorNitTienda.set(null);
      }

      if (!this.direccionTienda().trim()) {
        this.errorDireccionTienda.set('La dirección física en Santa Cruz es obligatoria.');
        valido = false;
      } else {
        this.errorDireccionTienda.set(null);
      }
    } else {
      // Repartidor
      if (!this.placaVehiculo().trim()) {
        this.errorPlaca.set('El número de placa del vehículo es obligatorio.');
        valido = false;
      } else {
        this.errorPlaca.set(null);
      }

      if (!this.licenciaConducir().trim()) {
        this.errorLicencia.set('La licencia de conducir o CI es obligatoria.');
        valido = false;
      } else {
        this.errorLicencia.set(null);
      }
    }

    if (!this.aceptaTerminos()) {
      this.errorTerminos.set('Debes aceptar las políticas y condiciones de la empresa.');
      valido = false;
    } else {
      this.errorTerminos.set(null);
    }

    return valido;
  }

  enviarSolicitudAliado() {
    if (!this.validarAliado()) {
      return;
    }

    this.cargando.set(true);
    this.errorGeneral.set(null);

    if (this.tipoAliado() === 'VENDEDOR') {
      this.tiendasService
        .registrarSolicitudTienda({
          nombre_completo: this.nombreCompleto().trim(),
          correo: this.correo().trim(),
          telefono: this.telefono(),
          clave: this.clave(),
          nombre_tienda: this.nombreTienda().trim(),
          nit: this.nitTienda().trim(),
          direccion_escrita: this.direccionTienda().trim(),
          referencia: this.referenciaTienda().trim() || undefined,
          horario_atencion: this.horarioTienda().trim() || undefined,
          tipo_establecimiento: this.tipoEstablecimiento(),
          especialidad: this.especialidadTienda().trim() || undefined,
          servicios_taller: this.tipoEstablecimiento() === 'TIENDA_REPUESTOS' ? undefined : (this.serviciosTaller().trim() || undefined),
          latitud: this.latitudTienda(),
          longitud: this.longitudTienda(),
          plan_suscripcion: 'GRATUITO',
        })
        .subscribe({
          next: () => {
            this.cargando.set(false);
            this.solicitudEnviada.set(true);
            this.destruirMapaTienda();
          },
          error: (err) => {
            this.cargando.set(false);
            const msg = formatearErrorHttp(err, 'Error al enviar la solicitud de tienda/taller.');
            if (err?.status === 409 || msg.toLowerCase().includes('registrado') || msg.toLowerCase().includes('correo')) {
              this.errorCorreo.set('Este correo electrónico ya está registrado. Inicia sesión o utiliza otro.');
              this.errorGeneral.set('El correo de acceso ya se encuentra registrado con otra cuenta.');
            } else {
              this.errorGeneral.set(msg);
            }
          },
        });
    } else {
      const vehiculo = this.tipoVehiculoSeleccionado();
      this.repartidoresService
        .registrarSolicitudRepartidor({
          nombre_completo: this.nombreCompleto().trim(),
          correo: this.correo().trim(),
          telefono: this.telefono(),
          clave: this.clave(),
          ciudad_zona: 'Santa Cruz de la Sierra',
          tipo_vehiculo: (vehiculo?.codigo as TipoVehiculoEnum) || TipoVehiculoEnum.MOTOCICLETA,
          tipo_vehiculo_id: vehiculo?.id,
          placa: this.placaVehiculo().trim().toUpperCase(),
          licencia_conducir: this.licenciaConducir().trim(),
          capacidad_peso_min_kg: this.pesoMinKg(),
          capacidad_peso_max_kg: this.pesoMaxKg(),
          tamano_maximo: this.tamanoMaximo(),
        })
        .subscribe({
          next: () => {
            this.cargando.set(false);
            this.solicitudEnviada.set(true);
          },
          error: (err) => {
            this.cargando.set(false);
            const msg = formatearErrorHttp(err, 'Error al enviar la solicitud de repartidor.');
            if (err?.status === 409 || msg.toLowerCase().includes('registrado') || msg.toLowerCase().includes('correo')) {
              this.errorCorreo.set('Este correo electrónico ya está registrado. Inicia sesión o utiliza otro.');
              this.errorGeneral.set('El correo de acceso ya se encuentra registrado con otra cuenta.');
            } else {
              this.errorGeneral.set(msg);
            }
          },
        });
    }
  }

  ngOnDestroy() {
    this.destruirMapaTienda();
  }
}
