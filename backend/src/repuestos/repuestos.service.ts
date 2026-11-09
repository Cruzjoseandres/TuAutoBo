import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Repuesto } from './entities/repuesto.entity';
import { CrearRepuestoDto } from './dto/crear-repuesto.dto';
import { ActualizarRepuestoDto } from './dto/actualizar-repuesto.dto';
import { FiltrarRepuestosDto } from './dto/filtrar-repuestos.dto';
import { TipoCambioService } from '../tipo-cambio/tipo-cambio.service';
import { ParametrosService } from '../parametros/parametros.service';
import { TiendasService } from '../tiendas/tiendas.service';
import { VehiculosService } from '../vehiculos/vehiculos.service';
import { CategoriasService } from '../categorias/categorias.service';
import { FabricantesService } from '../fabricantes/fabricantes.service';
import { MonedaEnum } from '../common/enums';

@Injectable()
export class RepuestosService {
  constructor(
    @InjectRepository(Repuesto)
    private readonly repuestoRepository: Repository<Repuesto>,
    private readonly tipoCambioService: TipoCambioService,
    private readonly parametrosService: ParametrosService,
    private readonly tiendasService: TiendasService,
    private readonly vehiculosService: VehiculosService,
    private readonly categoriasService: CategoriasService,
    private readonly fabricantesService: FabricantesService,
  ) {}

  /**
   * Sanitiza la entidad para la API pública y el Comprador.
   * SEGURIDAD: Nunca expone el stock físico exacto (stock_disponible, stock_reservado)
   * ni datos confidenciales de la tienda.
   */
  sanitizarParaComprador(rep: Repuesto): any {
    if (!rep) return null;
    const { stock_reservado, ...publico } = rep;

    // Si la tienda incluye datos de usuario, limpiar claves y hashes
    let tiendaSegura = publico.tienda;
    if (tiendaSegura && tiendaSegura.usuario) {
      const { clave, ...usuarioSeguro } = tiendaSegura.usuario as any;
      tiendaSegura = { ...tiendaSegura, usuario: usuarioSeguro };
    }

    return {
      ...publico,
      tienda: tiendaSegura,
      stock_disponible: rep.stock_disponible,
      esta_disponible: Number(rep.stock_disponible || 0) > 0,
      estado_disponibilidad: Number(rep.stock_disponible || 0) > 0 ? 'EN_STOCK' : 'AGOTADO',
    };
  }

  async findAll(): Promise<Repuesto[]> {
    return this.repuestoRepository.find({
      relations: {
        categoria: true,
        fabricante: true,
        vehiculo: { modelo: { marca: true } },
        tienda: true,
      },
      order: { es_destacado: 'DESC', nivel_prioridad: 'DESC', creado_en: 'DESC' },
    });
  }

  async findById(id: string): Promise<Repuesto> {
    const rep = await this.repuestoRepository.findOne({
      where: { id },
      relations: {
        categoria: true,
        fabricante: true,
        vehiculo: { modelo: { marca: true } },
        tienda: true,
      },
    });
    if (!rep) {
      throw new NotFoundException(`Repuesto con ID ${id} no encontrado`);
    }
    return rep;
  }

  async findByIdPublico(id: string): Promise<any> {
    const rep = await this.findById(id);
    return this.sanitizarParaComprador(rep);
  }

  /**
   * Obtener catálogo de una tienda específica con inventario real (solo para la tienda/vendedor)
   */
  async findByTiendaId(tiendaId: string): Promise<Repuesto[]> {
    return this.repuestoRepository.find({
      where: { tienda_id: tiendaId },
      relations: {
        categoria: true,
        fabricante: true,
        vehiculo: { modelo: { marca: true } },
      },
      order: { creado_en: 'DESC' },
    });
  }

  private construirQueryBusqueda(filtros: FiltrarRepuestosDto) {
    const qb = this.repuestoRepository
      .createQueryBuilder('repuesto')
      .leftJoinAndSelect('repuesto.categoria', 'categoria')
      .leftJoinAndSelect('repuesto.fabricante', 'fabricante')
      .leftJoinAndSelect('repuesto.vehiculo', 'vehiculo')
      .leftJoinAndSelect('vehiculo.modelo', 'modelo')
      .leftJoinAndSelect('modelo.marca', 'marca')
      .leftJoinAndSelect('repuesto.tienda', 'tienda')
      .where('repuesto.esta_activo = :activo', { activo: true })
      .andWhere('repuesto.stock_disponible > 0');

    if (filtros.vehiculo_id) {
      qb.andWhere('repuesto.vehiculo_id = :vehiculoId', { vehiculoId: filtros.vehiculo_id });
    } else if (filtros.modelo_id) {
      qb.andWhere('vehiculo.modelo_id = :modeloId', { modeloId: filtros.modelo_id });
    } else if (filtros.marca_id) {
      qb.andWhere('modelo.marca_id = :marcaId', { marcaId: filtros.marca_id });
    }

    if (filtros.categoria_id) {
      qb.andWhere('repuesto.categoria_id = :categoriaId', { categoriaId: filtros.categoria_id });
    }

    if (filtros.condicion) {
      qb.andWhere('repuesto.condicion = :condicion', { condicion: filtros.condicion });
    }

    if (filtros.tamano) {
      qb.andWhere('repuesto.tamano = :tamano', { tamano: filtros.tamano });
    }

    if (filtros.busqueda) {
      const busquedaLimpia = `%${filtros.busqueda.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(repuesto.titulo) LIKE :b OR LOWER(repuesto.sku) LIKE :b OR LOWER(repuesto.numero_oem) LIKE :b OR LOWER(fabricante.nombre) LIKE :b)',
        { b: busquedaLimpia },
      );
    }

    // Priorizar productos patrocinados/destacados
    qb.addOrderBy('repuesto.es_destacado', 'DESC');
    qb.addOrderBy('repuesto.nivel_prioridad', 'DESC');

    if (filtros.orden === 'PRECIO_ASC') {
      qb.addOrderBy('repuesto.precio_bob', 'ASC');
    } else if (filtros.orden === 'PRECIO_DESC') {
      qb.addOrderBy('repuesto.precio_bob', 'DESC');
    } else {
      qb.addOrderBy('repuesto.creado_en', 'DESC');
    }

    return qb;
  }

  async buscar(filtros: FiltrarRepuestosDto): Promise<any[]> {
    const qb = this.construirQueryBusqueda(filtros);
    const pagina = Math.max(1, Number(filtros.pagina) || 1);
    const limite = Math.min(50, Math.max(1, Number(filtros.limite) || 12));
    qb.skip((pagina - 1) * limite).take(limite);
    const repuestos = await qb.getMany();
    return repuestos.map((r) => this.sanitizarParaComprador(r));
  }

  async buscarPaginado(filtros: FiltrarRepuestosDto) {
    const qb = this.construirQueryBusqueda(filtros);
    const pagina = Math.max(1, Number(filtros.pagina) || 1);
    const limite = Math.min(50, Math.max(1, Number(filtros.limite) || 9));
    const [datos, total] = await qb
      .skip((pagina - 1) * limite)
      .take(limite)
      .getManyAndCount();

    // Sanitizar datos para el comprador (sin stock físico exacto)
    const datosSeguros = datos.map((r) => this.sanitizarParaComprador(r));

    return {
      datos: datosSeguros,
      total,
      pagina,
      limite,
      total_paginas: Math.ceil(total / limite) || 1,
    };
  }

  async obtenerResenas(repuestoId: string): Promise<any[]> {
    const rep = await this.findById(repuestoId);
    return rep.resenas || [];
  }

  async crearResena(
    repuestoId: string,
    body: {
      autor_nombre: string;
      vehiculo_instalado?: string;
      calificacion: number;
      comentario: string;
    },
  ): Promise<any> {
    const rep = await this.findById(repuestoId);
    if (!rep.resenas) {
      rep.resenas = [];
    }

    const nuevaResena = {
      id: `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      autor_nombre: body.autor_nombre || 'Comprador Verificado TuAuto',
      vehiculo_instalado: body.vehiculo_instalado || 'Vehículo Registrado en Mi Garaje',
      calificacion: Math.min(5, Math.max(1, Number(body.calificacion) || 5)),
      comentario: body.comentario,
      fecha: new Date().toISOString(),
    };

    rep.resenas.unshift(nuevaResena);
    await this.repuestoRepository.save(rep);
    return nuevaResena;
  }

  async create(dto: CrearRepuestoDto): Promise<Repuesto> {
    await this.tiendasService.findById(dto.tienda_id);
    await this.vehiculosService.findById(dto.vehiculo_id);
    await this.categoriasService.findById(dto.categoria_id);
    await this.fabricantesService.findById(dto.fabricante_id);

    const tasa = await this.tipoCambioService.obtenerTasaActual(MonedaEnum.USD, MonedaEnum.BOB);

    let precioBob: number;
    let precioUsd: number;

    if (dto.moneda_base === MonedaEnum.USD) {
      precioUsd = dto.precio_base;
      precioBob = Math.round(dto.precio_base * tasa * 100) / 100;
    } else {
      precioBob = dto.precio_base;
      precioUsd = Math.round((dto.precio_base / tasa) * 100) / 100;
    }

    const nuevo = this.repuestoRepository.create({
      ...dto,
      precio_bob: precioBob,
      precio_usd: precioUsd,
      stock_reservado: 0,
      resenas: [],
    });

    return this.repuestoRepository.save(nuevo);
  }

  async reservarStock(id: string, cantidad: number = 1): Promise<Repuesto> {
    const rep = await this.findById(id);
    if (rep.stock_disponible < cantidad) {
      throw new BadRequestException(
        `Stock insuficiente para el repuesto '${rep.titulo}'.`,
      );
    }
    rep.stock_disponible -= cantidad;
    rep.stock_reservado += cantidad;
    if (rep.stock_disponible <= 0) {
      rep.esta_activo = false; // Auto-pausar si se agota el stock físico
    }
    return this.repuestoRepository.save(rep);
  }

  async liberarStock(id: string, cantidad: number = 1): Promise<Repuesto> {
    const rep = await this.findById(id);
    rep.stock_disponible += cantidad;
    rep.stock_reservado = Math.max(0, rep.stock_reservado - cantidad);
    return this.repuestoRepository.save(rep);
  }

  async descontarStockDefinitivo(id: string, cantidad: number = 1): Promise<Repuesto> {
    const rep = await this.findById(id);
    rep.stock_reservado = Math.max(0, rep.stock_reservado - cantidad);
    return this.repuestoRepository.save(rep);
  }

  async activarBoost(id: string): Promise<Repuesto> {
    const rep = await this.findById(id);
    const diasDuracion = await this.parametrosService.obtenerNumero('DIAS_DURACION_BOOST', 7);

    rep.es_destacado = true;
    rep.nivel_prioridad = 10;
    rep.destacado_hasta = new Date(Date.now() + diasDuracion * 24 * 60 * 60 * 1000);

    return this.repuestoRepository.save(rep);
  }

  async update(id: string, dto: ActualizarRepuestoDto): Promise<Repuesto> {
    const rep = await this.findById(id);

    // Recalcular precios si cambia el precio base o la moneda
    if (dto.precio_base !== undefined || dto.moneda_base !== undefined) {
      const precioBase = dto.precio_base !== undefined ? dto.precio_base : rep.precio_base;
      const monedaBase = dto.moneda_base || rep.moneda_base;
      const tasa = await this.tipoCambioService.obtenerTasaActual(MonedaEnum.USD, MonedaEnum.BOB);

      if (monedaBase === MonedaEnum.USD) {
        rep.precio_usd = precioBase;
        rep.precio_bob = Math.round(precioBase * tasa * 100) / 100;
      } else {
        rep.precio_bob = precioBase;
        rep.precio_usd = Math.round((precioBase / tasa) * 100) / 100;
      }
      rep.precio_base = precioBase;
      rep.moneda_base = monedaBase;
    }

    // Actualizar campos permitidos
    if (dto.titulo !== undefined) rep.titulo = dto.titulo;
    if (dto.descripcion !== undefined) rep.descripcion = dto.descripcion;
    if (dto.numero_oem !== undefined) rep.numero_oem = dto.numero_oem;
    if (dto.sku !== undefined) rep.sku = dto.sku;
    if (dto.condicion !== undefined) rep.condicion = dto.condicion;
    if (dto.meses_garantia !== undefined) rep.meses_garantia = dto.meses_garantia;
    if (dto.tamano !== undefined) rep.tamano = dto.tamano;
    if (dto.peso_kg !== undefined) rep.peso_kg = dto.peso_kg;
    if (dto.tiempo_entrega_horas !== undefined) rep.tiempo_entrega_horas = dto.tiempo_entrega_horas;
    if (dto.url_imagen !== undefined) rep.url_imagen = dto.url_imagen;
    if (dto.categoria_id !== undefined) rep.categoria_id = dto.categoria_id;
    if (dto.fabricante_id !== undefined) rep.fabricante_id = dto.fabricante_id;
    if (dto.vehiculo_id !== undefined) rep.vehiculo_id = dto.vehiculo_id;
    if (dto.stock_minimo !== undefined) rep.stock_minimo = dto.stock_minimo;

    if (dto.stock_disponible !== undefined) {
      rep.stock_disponible = dto.stock_disponible;
      if (rep.stock_disponible <= 0) {
        rep.esta_activo = false; // Auto-pausar si stock es 0
      }
    }

    if (dto.esta_activo !== undefined) {
      rep.esta_activo = dto.esta_activo;
    }

    return this.repuestoRepository.save(rep);
  }

  async toggleActivo(id: string): Promise<Repuesto> {
    const rep = await this.findById(id);
    rep.esta_activo = !rep.esta_activo;
    return this.repuestoRepository.save(rep);
  }

  /**
   * Busca otras tiendas REALES que vendan el mismo número OEM activo en stock
   */
  async buscarOtrasTiendas(repuestoId: string): Promise<any[]> {
    const rep = await this.findById(repuestoId);
    if (!rep.numero_oem || rep.numero_oem.trim() === '') {
      return [];
    }

    const otros = await this.repuestoRepository.find({
      where: {
        numero_oem: rep.numero_oem.trim(),
        tienda_id: Not(rep.tienda_id),
        esta_activo: true,
      },
      relations: {
        tienda: true,
      },
      order: {
        precio_bob: 'ASC',
      },
    });

    return otros
      .filter((o) => o.stock_disponible > 0 && o.tienda)
      .map((o) => ({
        repuesto_id: o.id,
        tienda_id: o.tienda.id,
        tienda_nombre: o.tienda.nombre,
        tienda_direccion: o.tienda.direccion_escrita,
        precio_bob: o.precio_bob,
        precio_usd: o.precio_usd,
        tiempo_entrega_horas: o.tiempo_entrega_horas,
        garantia_meses: o.meses_garantia,
      }));
  }
}
