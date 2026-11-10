import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  AuthService,
  TiendasService,
  RepuestosService,
  CategoriasService,
  FabricantesService,
  VehiculosService,
  TipoCambioService,
  ToastService,
  NavigationContextService,
} from '../../../services';
import { Tienda, Categoria, Fabricante, Vehiculo } from '../../../models';
import { formatearErrorHttp } from '../../../utils/error-formatter';
import {
  SelectComponent,
  SelectOption,
  ButtonComponent,
  IconComponent,
} from '../../../ui';

@Component({
  selector: 'app-crear-repuesto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectComponent,
    ButtonComponent,
    IconComponent,
  ],
  templateUrl: './crear-repuesto.component.html',
})
export class CrearRepuestoComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly navContext = inject(NavigationContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tiendasService = inject(TiendasService);
  private readonly repuestosService = inject(RepuestosService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly fabricantesService = inject(FabricantesService);
  private readonly vehiculosService = inject(VehiculosService);
  private readonly tipoCambioService = inject(TipoCambioService);
  private readonly toast = inject(ToastService);

  modoEdicion = signal<boolean>(false);
  repuestoId = signal<string | null>(null);

  tienda = signal<Tienda | null>(null);
  categorias = signal<Categoria[]>([]);
  fabricantes = signal<Fabricante[]>([]);
  vehiculos = signal<Vehiculo[]>([]);
  tasaDolar = signal<number>(6.96);

  // Campos del formulario (INICIALIZADOS EN VACÍO O NULL - CERO DATOS PREDEFINIDOS)
  titulo = signal<string>('');
  sku = signal<string>('');
  esSkuAuto = signal<boolean>(true);
  numeroOem = signal<string>('');
  descripcion = signal<string>('');
  categoriaId = signal<number | null>(null);
  fabricanteId = signal<number | null>(null);
  vehiculoId = signal<number | null>(null);
  condicion = signal<'NUEVO_ORIGINAL_OEM' | 'NUEVO_ALTERNATIVO' | 'REACONDICIONADO' | null>(null);
  monedaBase = signal<'BOB' | 'USD'>('BOB');
  precioBase = signal<number | null>(null);
  stockDisponible = signal<number | null>(null);
  stockMinimo = signal<number>(2);
  estaActivo = signal<boolean>(true);
  pesoKg = signal<number | null>(null);
  tamano = signal<'PEQUENO' | 'MEDIANO' | 'GRANDE' | null>(null);
  mesesGarantia = signal<number | null>(null);
  tiempoEntregaHoras = signal<number | null>(null);
  urlImagen = signal<string>('');

  guardando = signal<boolean>(false);
  errorGeneral = signal<string | null>(null);

  // Errores inline por campo
  errorTitulo = signal<string | null>(null);
  errorSku = signal<string | null>(null);
  errorCategoria = signal<string | null>(null);
  errorFabricante = signal<string | null>(null);
  errorVehiculo = signal<string | null>(null);
  errorCondicion = signal<string | null>(null);
  errorPrecio = signal<string | null>(null);
  errorStock = signal<string | null>(null);
  errorPeso = signal<string | null>(null);
  errorTamano = signal<string | null>(null);
  errorImagen = signal<string | null>(null);

  // Estado del Modal de Recorte 1:1 y Optimización Canvas
  mostrarModalRecorte = signal<boolean>(false);
  imagenOriginalSrc = signal<string | null>(null);
  zoom = signal<number>(1);
  rotacion = signal<number>(0);
  tamanoOptimizadoKb = signal<number>(0);
  subiendoImagen = signal<boolean>(false);
  currentImageBlob = signal<Blob | null>(null);
  isDraggingFile = signal<boolean>(false);

  private cachedImageElement: HTMLImageElement | null = null;
  private skuSuffixRandom = Math.floor(100 + Math.random() * 900);

  generarSkuSugerido(): string {
    const partes: string[] = [];

    // 1. Fabricante (3 letras)
    if (this.fabricanteId()) {
      const fab = this.fabricantes().find((f) => f.id === Number(this.fabricanteId()));
      if (fab?.nombre) {
        const fCode = fab.nombre.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase();
        if (fCode) partes.push(fCode);
      }
    }

    // 2. Categoría (3 letras representativas)
    if (this.categoriaId()) {
      const cat = this.categorias().find((c) => c.id === Number(this.categoriaId()));
      if (cat?.nombre) {
        const cNombre = cat.nombre.toUpperCase();
        let cCode = '';
        if (cNombre.includes('FRENO')) cCode = 'FRE';
        else if (cNombre.includes('FILTRO')) cCode = 'FIL';
        else if (cNombre.includes('MOTOR')) cCode = 'MOT';
        else if (cNombre.includes('SUSPENSI')) cCode = 'SUS';
        else if (cNombre.includes('ELÉCTR') || cNombre.includes('ELECTR')) cCode = 'ELE';
        else if (cNombre.includes('TRANSMISI') || cNombre.includes('EMBRAG')) cCode = 'TRA';
        else cCode = cat.nombre.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase();

        if (cCode) partes.push(cCode);
      }
    }

    // 3. Título del Repuesto (Iniciales o palabras clave)
    const tit = this.titulo().trim();
    if (tit) {
      const stopwords = ['DE', 'DEL', 'LA', 'EL', 'PARA', 'CON', 'Y', 'EN', 'LOS', 'LAS', 'UN', 'UNA', 'AL', 'A'];
      const palabras = tit
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9\s]/g, '')
        .split(/\s+/)
        .filter((p) => p.length > 1 && !stopwords.includes(p));

      if (palabras.length >= 2) {
        partes.push((palabras[0].substring(0, 3) + palabras[1].substring(0, 2)).toUpperCase());
      } else if (palabras.length === 1) {
        partes.push(palabras[0].substring(0, 4).toUpperCase());
      }
    }

    // 4. Si hay número OEM, usar los últimos 4 dígitos
    const oem = this.numeroOem().trim().replace(/[^A-Za-z0-9]/g, '');
    if (oem.length >= 4) {
      partes.push(oem.slice(-4).toUpperCase());
    } else if (oem) {
      partes.push(oem.toUpperCase());
    } else if (this.vehiculoId()) {
      const veh = this.vehiculos().find((v) => v.id === Number(this.vehiculoId()));
      if (veh?.modelo?.nombre) {
        const mCode = veh.modelo.nombre.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase();
        if (mCode) partes.push(mCode);
      }
    }

    // 5. Sufijo numérico para garantizar unicidad si no hay OEM
    if (!oem || partes.length < 3) {
      partes.push(this.skuSuffixRandom.toString());
    }

    return partes.join('-').toUpperCase();
  }

  actualizarSkuAuto() {
    if (!this.esSkuAuto()) return;
    const sugerido = this.generarSkuSugerido();
    if (sugerido) {
      this.sku.set(sugerido);
      if (this.errorSku()) this.errorSku.set(null);
    }
  }

  regenerarSku() {
    this.skuSuffixRandom = Math.floor(100 + Math.random() * 900);
    this.esSkuAuto.set(true);
    const sugerido = this.generarSkuSugerido();
    this.sku.set(sugerido);
    if (this.errorSku()) this.errorSku.set(null);
    if (sugerido) {
      this.toast.info(`SKU generado: ${sugerido}`);
    } else {
      this.toast.info('Ingresa al menos el título o fabricante para sugerir un SKU.');
    }
  }

  onTituloChange(val: string) {
    this.titulo.set(val);
    if (this.errorTitulo()) this.errorTitulo.set(null);
    this.actualizarSkuAuto();
  }

  onSkuChange(val: string) {
    this.sku.set(val.toUpperCase());
    if (!val.trim()) {
      this.esSkuAuto.set(true);
    } else {
      this.esSkuAuto.set(false);
    }
    if (this.errorSku()) this.errorSku.set(null);
  }

  onOemChange(val: string) {
    this.numeroOem.set(val);
    this.actualizarSkuAuto();
  }

  onCategoriaChange(val: number | null) {
    this.categoriaId.set(val);
    if (this.errorCategoria()) this.errorCategoria.set(null);
    this.actualizarSkuAuto();
  }

  onFabricanteChange(val: number | null) {
    this.fabricanteId.set(val);
    if (this.errorFabricante()) this.errorFabricante.set(null);
    this.actualizarSkuAuto();
  }

  onVehiculoChange(val: number | null) {
    this.vehiculoId.set(val);
    if (this.errorVehiculo()) this.errorVehiculo.set(null);
    this.actualizarSkuAuto();
  }

  onPrecioChange(val: number | null) {
    this.precioBase.set(val);
    if (this.errorPrecio()) this.errorPrecio.set(null);
  }

  onStockChange(val: number | null) {
    this.stockDisponible.set(val);
    if (this.errorStock()) this.errorStock.set(null);
  }

  onPesoChange(val: number | null) {
    this.pesoKg.set(val);
    if (this.errorPeso()) this.errorPeso.set(null);
  }

  opcionesCondicion: SelectOption[] = [
    { value: 'NUEVO_ORIGINAL_OEM', label: 'Nuevo Original OEM', hint: 'Fabricado por la marca oficial' },
    { value: 'NUEVO_ALTERNATIVO', label: 'Nuevo Alternativo Certificado', hint: 'Pieza de repuesto homologada' },
    { value: 'REACONDICIONADO', label: 'Reacondicionado con Garantía', hint: 'Restaurado bajo prueba técnica' },
  ];

  opcionesMoneda: SelectOption[] = [
    { value: 'BOB', label: 'Bolivianos (BOB)' },
    { value: 'USD', label: 'Dólares Americanos (USD)' },
  ];

  opcionesTamano: SelectOption[] = [
    { value: 'PEQUENO', label: 'PEQUEÑO', hint: 'Apto Moto Mochila (< 5 kg)' },
    { value: 'MEDIANO', label: 'MEDIANO', hint: 'Apto Moto Parrilla / Torito / Auto' },
    { value: 'GRANDE', label: 'GRANDE', hint: 'Requiere Camioneta / Utilitario' },
  ];

  opcionesCategorias = computed<SelectOption[]>(() =>
    this.categorias().map((c) => ({ value: c.id, label: c.nombre }))
  );

  opcionesFabricantes = computed<SelectOption[]>(() =>
    this.fabricantes().map((f) => ({
      value: f.id,
      label: f.pais_origen ? `${f.nombre} (${f.pais_origen})` : f.nombre,
    }))
  );

  opcionesVehiculos = computed<SelectOption[]>(() =>
    this.vehiculos().map((v) => ({
      value: v.id,
      label: `${v.modelo?.marca?.nombre} ${v.modelo?.nombre} (${v.anio} • ${v.motor})`,
    }))
  );

  precioCalculadoBob = computed(() => {
    const p = this.precioBase();
    if (!p || Number(p) <= 0) return 0;
    return this.monedaBase() === 'BOB'
      ? Number(p)
      : Math.round(Number(p) * this.tasaDolar() * 100) / 100;
  });

  precioCalculadoUsd = computed(() => {
    const p = this.precioBase();
    if (!p || Number(p) <= 0) return 0;
    return this.monedaBase() === 'USD'
      ? Number(p)
      : Math.round((Number(p) / this.tasaDolar()) * 100) / 100;
  });

  ngOnInit() {
    const unregisterModalCrop = this.navContext.registrarCerradorModal(() => {
      if (this.mostrarModalRecorte()) {
        this.mostrarModalRecorte.set(false);
        return true;
      }
      return false;
    });
    this.destroyRef.onDestroy(() => unregisterModalCrop());

    this.tipoCambioService.obtenerRegistro().subscribe((tc) => {
      if (tc?.tasa_cambio) this.tasaDolar.set(tc.tasa_cambio);
    });

    this.tiendasService.findAll().subscribe((t) => {
      if (t.length > 0) this.tienda.set(t[0]);
    });

    // Se cargan las opciones desde PostgreSQL sin autoseleccionar ninguna
    this.categoriasService.findAll().subscribe((c) => {
      this.categorias.set(c);
    });

    this.fabricantesService.findAll().subscribe((f) => {
      this.fabricantes.set(f);
    });

    this.vehiculosService.findAll().subscribe((v) => {
      this.vehiculos.set(v);
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicion.set(true);
      this.repuestoId.set(id);
      this.repuestosService.findById(id).subscribe({
        next: (rep) => {
          this.titulo.set(rep.titulo);
          this.sku.set(rep.sku);
          this.esSkuAuto.set(false);
          this.numeroOem.set(rep.numero_oem || '');
          this.descripcion.set(rep.descripcion);
          this.categoriaId.set(rep.categoria_id);
          this.fabricanteId.set(rep.fabricante_id);
          this.vehiculoId.set(rep.vehiculo_id);
          this.condicion.set(rep.condicion);
          this.monedaBase.set(rep.moneda_base);
          this.precioBase.set(rep.precio_base);
          this.stockDisponible.set(rep.stock_disponible);
          this.stockMinimo.set(rep.stock_minimo ?? 2);
          this.estaActivo.set(rep.esta_activo !== false);
          this.pesoKg.set(rep.peso_kg);
          this.tamano.set(rep.tamano);
          this.mesesGarantia.set(rep.meses_garantia ?? null);
          this.tiempoEntregaHoras.set(rep.tiempo_entrega_horas ?? null);
          this.urlImagen.set(rep.url_imagen);
        },
        error: () => {
          this.toast.error('No se pudo cargar el repuesto para edición.');
          this.router.navigate(['/vendedor']);
        },
      });
    }
  }

  // ==========================================
  // MANEJO DE ARCHIVOS, RECORTE 1:1 Y CANVAS
  // ==========================================

  onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.procesarArchivo(input.files[0]);
    input.value = '';
  }

  onFileDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDraggingFile.set(true);
  }

  onFileDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDraggingFile.set(false);
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDraggingFile.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.procesarArchivo(event.dataTransfer.files[0]);
    }
  }

  private procesarArchivo(file: File) {
    const formatosValidos = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!formatosValidos.includes(file.type)) {
      this.toast.error('Formato inválido', 'Selecciona una imagen en formato JPG, PNG o WebP.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      this.imagenOriginalSrc.set(src);
      this.zoom.set(1);
      this.rotacion.set(0);

      const img = new Image();
      img.onload = () => {
        this.cachedImageElement = img;
        this.mostrarModalRecorte.set(true);
        setTimeout(() => this.actualizarCanvas(), 50);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  rotar90() {
    this.rotacion.update((r) => (r + 90) % 360);
    this.actualizarCanvas();
  }

  onZoomChange(val: number) {
    this.zoom.set(Number(val));
    this.actualizarCanvas();
  }

  actualizarCanvas() {
    const img = this.cachedImageElement;
    if (!img) return;

    // Canvas interno en alta resolución cuadrada 800x800
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 800);

    ctx.save();
    ctx.translate(400, 400);
    ctx.rotate((this.rotacion() * Math.PI) / 180);
    ctx.scale(this.zoom(), this.zoom());

    // Mantener la relación de aspecto y centrar en 1:1
    const imgAspect = img.width / img.height;
    let drawW = 800;
    let drawH = 800;
    if (imgAspect > 1) {
      drawW = 800 * imgAspect;
      drawH = 800;
    } else {
      drawW = 800;
      drawH = 800 / imgAspect;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Renderizar vista previa interactiva en el DOM
    const previewCanvas = document.getElementById('previewCropCanvas') as HTMLCanvasElement;
    if (previewCanvas) {
      previewCanvas.width = 300;
      previewCanvas.height = 300;
      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        pCtx.clearRect(0, 0, 300, 300);
        pCtx.drawImage(canvas, 0, 0, 300, 300);
      }
    }

    // Comprimir en WebP al 85% de calidad para no saturar Cloudinary/Backend
    canvas.toBlob(
      (blob) => {
        if (blob) {
          this.currentImageBlob.set(blob);
          this.tamanoOptimizadoKb.set(Math.round(blob.size / 1024));
        }
      },
      'image/webp',
      0.85,
    );
  }

  guardarImagenAjustada() {
    const blob = this.currentImageBlob();
    if (!blob) return;

    this.subiendoImagen.set(true);
    this.repuestosService.subirImagen(blob, `repuesto-${Date.now()}.webp`).subscribe({
      next: (res) => {
        this.urlImagen.set(res.url);
        this.subiendoImagen.set(false);
        this.mostrarModalRecorte.set(false);
        if (this.errorImagen()) this.errorImagen.set(null);
        this.toast.exito('Fotografía Optimizada', 'Imagen encuadrada 1:1 subida con éxito.');
      },
      error: (err) => {
        this.subiendoImagen.set(false);
        this.toast.error(formatearErrorHttp(err, 'Error al subir la fotografía al servidor.'));
      },
    });
  }

  cerrarModalRecorte() {
    this.mostrarModalRecorte.set(false);
    this.cachedImageElement = null;
    this.imagenOriginalSrc.set(null);
  }

  eliminarImagen() {
    this.urlImagen.set('');
  }

  // ==========================================
  // VALIDACIÓN Y PUBLICACIÓN
  // ==========================================

  validar(): boolean {
    let valido = true;
    this.errorGeneral.set(null);

    if (!this.titulo().trim()) {
      this.errorTitulo.set('El título del repuesto es obligatorio.');
      valido = false;
    } else {
      this.errorTitulo.set(null);
    }

    if (!this.sku().trim() && this.titulo().trim()) {
      this.actualizarSkuAuto();
    }

    if (!this.sku().trim()) {
      this.errorSku.set('El código SKU es obligatorio.');
      valido = false;
    } else {
      this.errorSku.set(null);
    }

    if (!this.descripcion().trim()) {
      this.errorGeneral.set('La descripción técnica del repuesto es obligatoria.');
      valido = false;
    }

    if (!this.categoriaId()) {
      this.errorCategoria.set('Selecciona una categoría del sistema.');
      valido = false;
    } else {
      this.errorCategoria.set(null);
    }

    if (!this.fabricanteId()) {
      this.errorFabricante.set('Selecciona el fabricante de la pieza.');
      valido = false;
    } else {
      this.errorFabricante.set(null);
    }

    if (!this.vehiculoId()) {
      this.errorVehiculo.set('Selecciona el vehículo compatible.');
      valido = false;
    } else {
      this.errorVehiculo.set(null);
    }

    if (!this.condicion()) {
      this.errorCondicion.set('Selecciona la condición de la pieza.');
      valido = false;
    } else {
      this.errorCondicion.set(null);
    }

    if (!this.precioBase() || Number(this.precioBase()) <= 0) {
      this.errorPrecio.set('El precio debe ser mayor a 0.');
      valido = false;
    } else {
      this.errorPrecio.set(null);
    }

    if (this.stockDisponible() === null || Number(this.stockDisponible()) < 0) {
      this.errorStock.set('El stock disponible no puede estar vacío ni ser negativo.');
      valido = false;
    } else {
      this.errorStock.set(null);
    }

    if (!this.pesoKg() || Number(this.pesoKg()) <= 0) {
      this.errorPeso.set('El peso estimado es obligatorio para el cálculo de envío.');
      valido = false;
    } else {
      this.errorPeso.set(null);
    }

    if (!this.tamano()) {
      this.errorTamano.set('Selecciona el tamaño de paquete para la flota logística.');
      valido = false;
    } else {
      this.errorTamano.set(null);
    }

    if (!this.urlImagen().trim()) {
      this.errorImagen.set('Debes subir una fotografía del repuesto.');
      valido = false;
    } else {
      this.errorImagen.set(null);
    }

    return valido;
  }

  volver() {
    this.navContext.volver(['/vendedor', 'inventario']);
  }

  publicarRepuesto() {
    const t = this.tienda();
    if (!t) {
      this.toast.error('No se encontró una tienda activa asociada.');
      return;
    }

    if (!this.validar()) {
      this.errorGeneral.set('Por favor completa todos los campos obligatorios marcados en rojo.');
      return;
    }

    this.guardando.set(true);
    this.errorGeneral.set(null);

    const oem = this.numeroOem().toUpperCase().trim();
    const garantia =
      this.mesesGarantia() !== null
        ? Number(this.mesesGarantia())
        : undefined;
    const tiempoEntrega =
      this.tiempoEntregaHoras() !== null
        ? Number(this.tiempoEntregaHoras())
        : undefined;

    const payload = {
      titulo: this.titulo().trim(),
      sku: this.sku().toUpperCase().trim(),
      numero_oem: oem || undefined,
      descripcion: this.descripcion().trim(),
      url_imagen: this.urlImagen(),
      moneda_base: this.monedaBase(),
      precio_base: Number(this.precioBase()),
      stock_disponible: Number(this.stockDisponible()),
      stock_minimo: Number(this.stockMinimo() ?? 2),
      esta_activo: this.estaActivo(),
      peso_kg: Number(this.pesoKg()),
      tamano: this.tamano()!,
      condicion: this.condicion()!,
      meses_garantia: garantia,
      tiempo_entrega_horas: tiempoEntrega,
      categoria_id: Number(this.categoriaId()),
      fabricante_id: Number(this.fabricanteId()),
      vehiculo_id: Number(this.vehiculoId()),
    };

    if (this.modoEdicion() && this.repuestoId()) {
      this.repuestosService
        .actualizar(this.repuestoId()!, payload)
        .subscribe({
          next: () => {
            this.guardando.set(false);
            this.toast.exito('¡Repuesto actualizado exitosamente!');
            this.volver();
          },
          error: (err) => {
            this.guardando.set(false);
            const msg = formatearErrorHttp(err, 'Error al actualizar el repuesto.');
            this.toast.error(msg);
          },
        });
      return;
    }

    this.repuestosService
      .create({
        ...payload,
        tienda_id: t.id,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.toast.exito('¡Repuesto publicado exitosamente en el catálogo de TuAuto!');
          this.volver();
        },
        error: (err) => {
          this.guardando.set(false);
          const msg = formatearErrorHttp(
            err,
            'Error al publicar el repuesto. Verifica que el SKU sea único.',
          );
          if (err?.status === 409 || msg.toLowerCase().includes('sku')) {
            this.errorSku.set('Este código SKU ya está en uso por otro repuesto.');
            this.errorGeneral.set(
              'El código SKU ingresado ya se encuentra registrado en el sistema.',
            );
          } else {
            this.errorGeneral.set(msg);
          }
          this.toast.error(msg);
        },
      });
  }
}
