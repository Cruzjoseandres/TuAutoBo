import { Component, HostListener, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { UbicacionService, DireccionComprador } from '../../services/ubicacion.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-ubicacion-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (ubicacionService.modalSelectorAbierto()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
        
        <!-- Backdrop translúcido con desenfoque que cierra al hacer clic afuera -->
        <div 
          class="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-200"
          (click)="cerrar()">
        </div>

        <!-- Ventana Modal Apple Glassmorphism centrada en la pantalla -->
        <div 
          class="relative w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] shadow-2xl space-y-4 animate-scale-pop z-10 text-left">
          
          <!-- Encabezado con Botón 'X' Prominente y Accesible -->
          <div class="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
            <div>
              <h3 class="text-sm font-bold text-neutral-900 dark:text-white">Direcciones de Entrega (Santa Cruz)</h3>
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Tiempos y costos de envío calculados en tiempo real</p>
            </div>
            
            <!-- Botón X con alto contraste y hover -->
            <button 
              type="button"
              (click)="cerrar()"
              title="Cerrar ventana (Esc)"
              class="active:scale-95 transition-all w-8 h-8 rounded-full bg-black/[0.06] dark:bg-white/[0.1] hover:bg-black/[0.12] dark:hover:bg-white/[0.2] flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white shadow-sm focus:outline-none">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Mensaje de Error General / Servidor (Estilo Apple Alert) -->
          @if (mensajeErrorGeneral()) {
            <div class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2 animate-fadeIn">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{{ mensajeErrorGeneral() }}</span>
            </div>
          }

          @if (!mostrarFormulario()) {
            @if (ubicacionService.direcciones().length === 0) {
              <!-- Estado Vacío Elegante Estilo Apple -->
              <div class="py-6 px-4 text-center space-y-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                <div class="w-12 h-12 mx-auto rounded-full bg-blue-500/10 text-[#0071E3] flex items-center justify-center">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-bold text-neutral-900 dark:text-white">Sin direcciones registradas</p>
                  <p class="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    Agrega tu dirección de entrega en Santa Cruz para recibir repuestos y calcular tiempos de despacho en tiempo real.
                  </p>
                </div>
                <button
                  type="button"
                  (click)="abrirFormulario()"
                  class="active:scale-[0.98] inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-sm transition-all">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Agregar Mi Primera Dirección</span>
                </button>
              </div>
            } @else {
              <!-- Lista de Direcciones Guardadas -->
              <div class="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                @for (dir of ubicacionService.direcciones(); track dir.id) {
                  <div 
                    (click)="seleccionar(dir)"
                    [class.ring-2]="ubicacionService.ubicacionActiva()?.id === dir.id"
                    [class.ring-[#0071E3]]="ubicacionService.ubicacionActiva()?.id === dir.id"
                    class="cursor-pointer p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100/80 dark:hover:bg-neutral-800 border border-black/[0.04] dark:border-white/[0.06] flex items-start justify-between space-x-3 transition-all">
                    <div class="space-y-0.5">
                      <div class="flex items-center space-x-2">
                        <span class="text-xs font-bold text-neutral-900 dark:text-white">{{ dir.alias }}</span>
                        @if (ubicacionService.ubicacionActiva()?.id === dir.id) {
                          <span class="px-2 py-0.5 rounded-full bg-[#0071E3] text-white text-[9px] font-bold">Activa</span>
                        }
                      </div>
                      <p class="text-xs text-neutral-600 dark:text-neutral-300">{{ dir.direccion_escrita }}</p>
                      @if (dir.referencia) {
                        <p class="text-[10px] text-neutral-400">Ref: {{ dir.referencia }}</p>
                      }
                      <p class="text-[9px] text-neutral-400 font-mono">Coords: {{ dir.latitud.toFixed(4) }}, {{ dir.longitud.toFixed(4) }}</p>
                    </div>
                    <svg class="w-4 h-4 text-[#0071E3] flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                }
              </div>

              <!-- Botón Agregar Nueva Dirección -->
              <button
                type="button"
                (click)="abrirFormulario()"
                class="active:scale-[0.98] w-full py-2.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-xs font-semibold text-neutral-900 dark:text-white flex items-center justify-center space-x-1.5 transition-all">
                <svg class="w-3.5 h-3.5 text-[#0071E3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Agregar Nueva Dirección en Santa Cruz</span>
              </button>
            }

            <!-- Botón Cerrar Secundario Inferior -->
            <div class="pt-1 flex justify-end">
              <button
                type="button"
                (click)="cerrar()"
                class="px-4 py-1.5 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">
                Cerrar
              </button>
            </div>
          } @else {
            <!-- Formulario Nueva Ubicación con Mapa Interactivo -->
            <div class="space-y-3.5 text-xs">
              
              <!-- Sección de Mapa Interactivo Leaflet -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-1.5">
                    <span class="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">Punto en el Mapa</span>
                    <span class="text-rose-500 font-bold">*</span>
                  </div>

                  <!-- Botón GPS "Usar mi ubicación actual" -->
                  <button
                    type="button"
                    (click)="usarUbicacionActual()"
                    [disabled]="obteniendoGps()"
                    class="active:scale-95 inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-[#0071E3] font-semibold text-[11px] transition-all disabled:opacity-50">
                    @if (obteniendoGps()) {
                      <svg class="w-3 h-3 animate-spin text-[#0071E3]" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Obteniendo GPS...</span>
                    } @else {
                      <svg class="w-3 h-3 text-[#0071E3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.071-7.071l-1.414 1.414M8.343 15.657l-1.414 1.414m12.728 0l-1.414-1.414M8.343 8.343L6.929 6.929M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Usar mi ubicación actual</span>
                    }
                  </button>
                </div>

                <!-- Contenedor del Mapa -->
                <div class="relative rounded-2xl overflow-hidden border border-black/[0.08] dark:border-white/[0.12] shadow-inner">
                  <div id="mapa-ubicacion" class="w-full h-48 sm:h-52 z-0 bg-neutral-100 dark:bg-neutral-800"></div>
                  
                  <!-- Píldora flotante inferior con coordenadas reales -->
                  <div class="absolute bottom-2 left-2 z-10 pointer-events-none px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-mono flex items-center space-x-1.5 shadow">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Lat: {{ latitudSeleccionada().toFixed(4) }} | Lng: {{ longitudSeleccionada().toFixed(4) }}</span>
                  </div>
                </div>

                <p class="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
                  Arrastra el pin azul o haz clic en cualquier zona de Santa Cruz para marcar tu ubicación exacta.
                </p>
              </div>

              <!-- Campo 1: Nombre o Alias -->
              <div>
                <label class="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                  Nombre o Alias (ej. Mi Taller, Casa) <span class="text-rose-500 font-bold">*</span>
                </label>
                <input 
                  type="text" 
                  [(ngModel)]="nuevoAlias"
                  (input)="errorAlias.set('')"
                  placeholder="Ej. Taller Mecánico Banzer"
                  [class.border-rose-500]="errorAlias()"
                  [class.focus:ring-rose-500]="errorAlias()"
                  class="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:ring-2 focus:ring-[#0071E3] focus:outline-none text-neutral-900 dark:text-white transition-all"
                />
                @if (errorAlias()) {
                  <p class="mt-1 text-[11px] text-rose-500 flex items-center space-x-1 animate-fadeIn">
                    <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <span>{{ errorAlias() }}</span>
                  </p>
                }
              </div>

              <!-- Ubicación detectada en Maps (Automática por Pin GPS) -->
              <div class="p-3 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 flex items-start space-x-2.5">
                <svg class="w-4 h-4 text-[#0071E3] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <div class="min-w-0 flex-1">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-[#0071E3] block">Punto Seleccionado en Mapa</span>
                  <p class="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                    {{ nuevaDireccion() || ('Ubicación GPS (' + latitudSeleccionada().toFixed(4) + ', ' + longitudSeleccionada().toFixed(4) + ')') }}
                  </p>
                </div>
              </div>

              <!-- Campo 2: Referencia de fachada / Nro. de casa (Opcional) -->
              <div>
                <label class="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                  Referencia de fachada / Nro. de casa <span class="text-neutral-400 font-normal">(Opcional)</span>
                </label>
                <input 
                  type="text" 
                  [(ngModel)]="nuevaReferencia"
                  placeholder="Ej. Portón blanco #230, frente al surtidor"
                  class="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs focus:ring-2 focus:ring-[#0071E3] focus:outline-none text-neutral-900 dark:text-white"
                />
              </div>

              <!-- Botones de Acción -->
              <div class="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  (click)="volverALista()"
                  class="flex-1 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                  Volver
                </button>
                <button
                  type="button"
                  (click)="guardarDireccion()"
                  [disabled]="guardando()"
                  class="flex-1 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5">
                  @if (guardando()) {
                    <svg class="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Guardando...</span>
                  } @else {
                    <span>Guardar Ubicación</span>
                  }
                </button>
              </div>
            </div>
          }

        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes scalePop {
      from {
        opacity: 0;
        transform: scale(0.96) translateY(-4px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    .animate-scale-pop {
      animation: scalePop 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-fadeIn {
      animation: fadeIn 0.15s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-2px); }
      to { opacity: 1; transform: translateY(0); }
    }
    :host ::ng-deep .apple-map-pin-container {
      background: transparent;
      border: none;
    }
  `],
})
export class UbicacionModalComponent implements OnDestroy {
  protected readonly ubicacionService = inject(UbicacionService);
  private readonly toast = inject(ToastService);

  mostrarFormulario = signal<boolean>(false);
  nuevoAlias = signal<string>('');
  nuevaDireccion = signal<string>('');
  nuevaReferencia = signal<string>('');

  // Coordenadas seleccionadas (Por defecto: Centro de Santa Cruz de la Sierra)
  latitudSeleccionada = signal<number>(-17.7833);
  longitudSeleccionada = signal<number>(-63.1821);

  // Estados de carga y validación
  obteniendoGps = signal<boolean>(false);
  guardando = signal<boolean>(false);
  mensajeErrorGeneral = signal<string>('');
  errorAlias = signal<string>('');
  errorDireccion = signal<string>('');

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  @HostListener('window:keydown.escape')
  onEscape() {
    this.cerrar();
  }

  ngOnDestroy() {
    this.destruirMapa();
  }

  cerrar() {
    this.destruirMapa();
    this.ubicacionService.modalSelectorAbierto.set(false);
    this.mostrarFormulario.set(false);
    this.limpiarErrores();
  }

  abrirFormulario() {
    this.mostrarFormulario.set(true);
    this.limpiarErrores();
    setTimeout(() => {
      this.inicializarMapa();
    }, 120);
  }

  volverALista() {
    this.destruirMapa();
    this.mostrarFormulario.set(false);
    this.limpiarErrores();
  }

  private limpiarErrores() {
    this.mensajeErrorGeneral.set('');
    this.errorAlias.set('');
    this.errorDireccion.set('');
  }

  seleccionar(dir: DireccionComprador) {
    this.ubicacionService.seleccionarUbicacion(dir);
    this.cerrar();
  }

  private inicializarMapa() {
    const el = document.getElementById('mapa-ubicacion');
    if (!el) return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const defaultLat = this.latitudSeleccionada();
    const defaultLng = this.longitudSeleccionada();

    // Crear mapa Leaflet centrado en Santa Cruz de la Sierra
    this.map = L.map('mapa-ubicacion', {
      zoomControl: true,
      attributionControl: false,
    }).setView([defaultLat, defaultLng], 14);

    // Capa de tiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    // Icono Apple Pin Personalizado
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

    // Marcador interactivo y arrastrable
    this.marker = L.marker([defaultLat, defaultLng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(this.map);

    // Evento al arrastrar el pin
    this.marker.on('dragend', () => {
      if (!this.marker) return;
      const pos = this.marker.getLatLng();
      this.actualizarCoordenadas(pos.lat, pos.lng);
    });

    // Evento al hacer clic en el mapa
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      }
      this.actualizarCoordenadas(lat, lng);
    });

    // Redimensionar después de renderizar en el modal y obtener nombre de calle inicial
    this.consultarGeocodificacionInversa(defaultLat, defaultLng);
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 250);
  }

  private actualizarCoordenadas(lat: number, lng: number) {
    this.latitudSeleccionada.set(lat);
    this.longitudSeleccionada.set(lng);
    this.consultarGeocodificacionInversa(lat, lng);
  }

  usarUbicacionActual() {
    if (!navigator.geolocation) {
      this.toast.advertencia('GPS no disponible', 'Tu navegador o dispositivo no soporta geolocalización.');
      return;
    }

    this.obteniendoGps.set(true);
    this.mensajeErrorGeneral.set('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.obteniendoGps.set(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.latitudSeleccionada.set(lat);
        this.longitudSeleccionada.set(lng);

        if (this.map && this.marker) {
          this.marker.setLatLng([lat, lng]);
          this.map.flyTo([lat, lng], 16, { animate: true, duration: 1 });
        }

        this.consultarGeocodificacionInversa(lat, lng);
        this.toast.info('Ubicación detectada', 'Se centró el mapa en tu posición GPS actual.');
      },
      (error) => {
        this.obteniendoGps.set(false);
        let mensaje = 'No se pudo obtener la ubicación GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          mensaje = 'Permiso de ubicación denegado por el navegador. Puedes hacer clic en el mapa para marcar tu dirección.';
        } else if (error.code === error.TIMEOUT) {
          mensaje = 'Tiempo de espera agotado al consultar GPS.';
        }
        this.toast.advertencia('Aviso de GPS', mensaje);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  private consultarGeocodificacionInversa(lat: number, lng: number) {
    const fallbackCoords = `Punto en Mapa (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: { 'Accept-Language': 'es' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.display_name) {
          const calle = data.address?.road || data.address?.neighbourhood || data.address?.suburb || '';
          const barrio = data.address?.suburb || data.address?.neighbourhood || '';
          const ciudad = data.address?.city || data.address?.town || 'Santa Cruz de la Sierra';
          const partes = [calle, barrio && barrio !== calle ? barrio : '', ciudad].filter(Boolean);
          const sugerencia = partes.length > 0 ? partes.join(', ') : data.display_name.split(',').slice(0, 3).join(',');
          this.nuevaDireccion.set(sugerencia);
        } else {
          this.nuevaDireccion.set(fallbackCoords);
        }
      })
      .catch(() => {
        if (!this.nuevaDireccion().trim()) {
          this.nuevaDireccion.set(fallbackCoords);
        }
      });
  }

  private destruirMapa() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  guardarDireccion() {
    this.limpiarErrores();
    if (!this.nuevoAlias().trim()) {
      this.errorAlias.set('El nombre o alias es obligatorio (ej. Mi Taller, Casa).');
      return;
    }

    const direccionMapa =
      this.nuevaDireccion().trim() ||
      `Punto en Mapa (${this.latitudSeleccionada().toFixed(4)}, ${this.longitudSeleccionada().toFixed(4)})`;

    this.guardando.set(true);

    this.ubicacionService
      .agregarNuevaDireccion({
        alias: this.nuevoAlias().trim(),
        direccion_escrita: direccionMapa,
        referencia: this.nuevaReferencia().trim(),
        latitud: this.latitudSeleccionada(),
        longitud: this.longitudSeleccionada(),
        es_predeterminada: true,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.toast.exito('Ubicación guardada', `${this.nuevoAlias()} quedó activa como dirección de entrega.`);
          this.nuevoAlias.set('');
          this.nuevaDireccion.set('');
          this.nuevaReferencia.set('');
          this.cerrar();
        },
        error: (err) => {
          this.guardando.set(false);
          this.mensajeErrorGeneral.set(
            err.error?.message || 'No se pudo guardar la ubicación en el servidor. Intenta nuevamente.',
          );
        },
      });
  }
}
