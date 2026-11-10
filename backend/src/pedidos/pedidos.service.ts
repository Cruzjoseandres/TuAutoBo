import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import {
  CrearPedidoDto,
  CotizarEnvioDto,
  ConfirmarPagoDto,
  ConfirmarPinDto,
  AbrirDisputaDto,
} from './dto/crear-pedido.dto';
import { RepuestosService } from '../repuestos/repuestos.service';
import { TiendasService } from '../tiendas/tiendas.service';
import { ParametrosService } from '../parametros/parametros.service';
import { TipoCambioService } from '../tipo-cambio/tipo-cambio.service';
import { RepartidoresService } from '../repartidores/repartidores.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LogisticaContext } from './strategies';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import {
  EstadoPedidoEnum,
  MonedaEnum,
  TipoEntregaEnum,
  TamanoRepuestoEnum,
} from '../common/enums';

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    private readonly repuestosService: RepuestosService,
    private readonly tiendasService: TiendasService,
    private readonly parametrosService: ParametrosService,
    private readonly tipoCambioService: TipoCambioService,
    private readonly repartidoresService: RepartidoresService,
    private readonly usuariosService: UsuariosService,
    private readonly logisticaContext: LogisticaContext,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  private calcularDistanciaKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  async cotizarEnvio(dto: CotizarEnvioDto): Promise<{
    tarifa_envio_bs: number;
    distancia_km: number;
    detalles: string;
  }> {
    if (dto.tipo_entrega === TipoEntregaEnum.RETIRO_TIENDA) {
      const retiro = this.logisticaContext.obtenerEstrategia('RETIRO_TIENDA').calcularTarifa({
        distanciaKm: 0,
        pesoKg: 0,
        tamano: TamanoRepuestoEnum.PEQUENO,
      });
      return {
        tarifa_envio_bs: retiro.tarifa_envio_bs,
        distancia_km: retiro.distancia_km,
        detalles: retiro.detalles,
      };
    }

    const repuesto = await this.repuestosService.findById(dto.repuesto_id);
    const tienda = await this.tiendasService.findById(repuesto.tienda_id);

    const latDestino = dto.latitud_entrega ?? -17.7833;
    const lonDestino = dto.longitud_entrega ?? -63.1821;

    const distancia = this.calcularDistanciaKm(
      tienda.latitud,
      tienda.longitud,
      latDestino,
      lonDestino,
    );

    const tarifaBase = await this.parametrosService.obtenerNumero('ENVIO_TARIFA_BASE_BS', 10.0);
    const kmBase = await this.parametrosService.obtenerNumero('ENVIO_KM_BASE', 3.0);
    const precioKmExtra = await this.parametrosService.obtenerNumero('ENVIO_PRECIO_KM_ADICIONAL_BS', 2.0);
    const pesoBase = await this.parametrosService.obtenerNumero('ENVIO_PESO_BASE_KG', 5.0);
    const recargoKgExtra = await this.parametrosService.obtenerNumero('ENVIO_RECARGO_KG_EXTRA_BS', 1.5);
    const recargoMediano = await this.parametrosService.obtenerNumero('ENVIO_RECARGO_TAMANO_MEDIANO_BS', 3.0);
    const recargoGrande = await this.parametrosService.obtenerNumero('ENVIO_RECARGO_TAMANO_GRANDE_BS', 8.0);

    const cantidad = Math.max(1, Number(dto.cantidad) || 1);
    const pesoTotal = Number(repuesto.peso_kg || 1) * cantidad;

    // Delegación limpia mediante el Patrón Strategy
    const cotizacion = this.logisticaContext.calcularCotizacion(null, {
      distanciaKm: distancia,
      pesoKg: pesoTotal,
      tamano: repuesto.tamano,
      tarifaBase,
      kmBase,
      precioKmExtra,
      pesoBase,
      recargoKgExtra,
      recargoMediano,
      recargoGrande,
    });

    return {
      tarifa_envio_bs: cotizacion.tarifa_envio_bs,
      distancia_km: cotizacion.distancia_km,
      detalles: cotizacion.detalles,
    };
  }

  async crearPedido(dto: CrearPedidoDto): Promise<Pedido> {
    await this.usuariosService.findById(dto.usuario_comprador_id);
    const repuesto = await this.repuestosService.findById(dto.repuesto_id);

    const cantidad = Math.max(1, Number(dto.cantidad) || 1);

    // 1. Bloquear stock en reserva según la cantidad elegida
    await this.repuestosService.reservarStock(repuesto.id, cantidad);

    // 2. Cotizar flete con el peso multiplicado por cantidad
    let tarifaEnvioBs = 0.0;
    if (dto.tipo_entrega === TipoEntregaEnum.DELIVERY_MOTO) {
      const cotizacion = await this.cotizarEnvio({
        repuesto_id: repuesto.id,
        tipo_entrega: dto.tipo_entrega,
        latitud_entrega: dto.latitud_entrega,
        longitud_entrega: dto.longitud_entrega,
        cantidad: cantidad,
      });
      tarifaEnvioBs = cotizacion.tarifa_envio_bs;
    }

    // 3. Parámetros de negocio
    const tarifaAppBs = await this.parametrosService.obtenerNumero('TARIFA_USO_APP_BS', 2.0);
    const porcentajeComision = await this.parametrosService.obtenerNumero('PORCENTAJE_COMISION_TUAUTO', 10.0);
    const tasaCongelada = await this.tipoCambioService.obtenerTasaActual(MonedaEnum.USD, MonedaEnum.BOB);

    const subtotalRepuestoBs = Math.round(repuesto.precio_bob * cantidad * 100) / 100;
    const totalBs = Math.round((subtotalRepuestoBs + tarifaEnvioBs + tarifaAppBs) * 100) / 100;
    const totalUsd = Math.round((totalBs / tasaCongelada) * 100) / 100;

    // Retención TuAuto y Liquidación Tienda
    const comisionTuautoBs = Math.round((subtotalRepuestoBs * (porcentajeComision / 100)) * 100) / 100;
    const liquidacionTiendaBs = Math.round((subtotalRepuestoBs - comisionTuautoBs) * 100) / 100;

    // PIN de 4 dígitos para liberación de fondos en entrega
    const pinEntrega = Math.floor(1000 + Math.random() * 9000).toString();
    const numeroOrden = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

    // Payload de QR Simple para banca móvil en Bolivia
    const codigoQrPayload = `00020101021226${numeroOrden}520460145303068540${totalBs}5802BO5915TuAuto Bolivia6010Santa Cruz62200516${pinEntrega}6304ABCD`;

    const nuevoPedido = this.pedidoRepository.create({
      numero_orden: numeroOrden,
      moneda_pago: dto.moneda_pago,
      metodo_pago: dto.metodo_pago,
      cantidad: cantidad,
      subtotal_repuesto_bs: subtotalRepuestoBs,
      tarifa_envio_bs: tarifaEnvioBs,
      tarifa_servicio_app_bs: tarifaAppBs,
      total_bs: totalBs,
      total_usd: totalUsd,
      tasa_cambio_congelada: tasaCongelada,
      comision_tuauto_bs: comisionTuautoBs,
      liquidacion_tienda_bs: liquidacionTiendaBs,
      estado: EstadoPedidoEnum.PENDIENTE_PAGO,
      tipo_entrega: dto.tipo_entrega,
      latitud_entrega: dto.latitud_entrega ?? null,
      longitud_entrega: dto.longitud_entrega ?? null,
      direccion_escrita: dto.direccion_escrita ?? '',
      referencia: dto.referencia ?? '',
      pin_entrega: pinEntrega,
      codigo_qr_payload: codigoQrPayload,
      usuario_comprador_id: dto.usuario_comprador_id,
      tienda_id: repuesto.tienda_id,
      repuesto_id: repuesto.id,
    });

    const guardado = await this.pedidoRepository.save(nuevoPedido);
    const completo = await this.findById(guardado.id);
    this.realtimeGateway.emitirPedidoActualizado(completo, 'CREADO');
    return completo;
  }

  async confirmarPagoQr(id: string, dto: ConfirmarPagoDto): Promise<Pedido> {
    const pedido = await this.findById(id);
    if (pedido.estado !== EstadoPedidoEnum.PENDIENTE_PAGO) {
      throw new BadRequestException(`El pedido no se encuentra en estado PENDIENTE_PAGO. Estado actual: ${pedido.estado}`);
    }

    pedido.codigo_autorizacion_banco = dto.codigo_autorizacion_banco;
    pedido.estado =
      pedido.tipo_entrega === TipoEntregaEnum.RETIRO_TIENDA
        ? EstadoPedidoEnum.LISTO_RETIRO
        : EstadoPedidoEnum.EN_PREPARACION;

    await this.pedidoRepository.save(pedido);
    const completo = await this.findById(id);
    this.realtimeGateway.emitirPedidoActualizado(completo, 'PAGO_CONFIRMADO');
    return completo;
  }

  async asignarRepartidor(id: string, repartidorId: string): Promise<Pedido> {
    const pedido = await this.findById(id);
    const repartidor = await this.repartidoresService.findById(repartidorId);
    const repuesto = await this.repuestosService.findById(pedido.repuesto_id);

    // Validación polimórfica mediante el Patrón Strategy del vehículo del repartidor
    const strategy = this.logisticaContext.obtenerEstrategia(repartidor.tipo_vehiculo);
    if (!strategy.puedeTransportar(repuesto.peso_kg, repuesto.tamano)) {
      throw new BadRequestException(
        `El vehículo (${strategy.nombre}) no cuenta con capacidad técnica para transportar este repuesto (${repuesto.peso_kg}kg, tamaño ${repuesto.tamano}). Límite de carga: ${strategy.pesoMaximoKg}kg.`,
      );
    }

    pedido.repartidor_id = repartidor.id;
    pedido.estado = EstadoPedidoEnum.EN_CAMINO_A_TIENDA;

    await this.pedidoRepository.save(pedido);
    const completo = await this.findById(id);
    this.realtimeGateway.emitirPedidoActualizado(completo, 'REPARTIDOR_ASIGNADO');
    return completo;
  }

  async avanzarEstadoRepartidor(
    id: string,
    repartidorId: string,
    nuevoEstado: EstadoPedidoEnum,
  ): Promise<Pedido> {
    const pedido = await this.findById(id);

    if (pedido.repartidor_id !== repartidorId) {
      throw new BadRequestException('No estás asignado como el repartidor oficial de este pedido.');
    }

    const transicionesValidas: Record<string, EstadoPedidoEnum[]> = {
      [EstadoPedidoEnum.EN_CAMINO_A_TIENDA]: [EstadoPedidoEnum.EN_TIENDA],
      [EstadoPedidoEnum.EN_TIENDA]: [EstadoPedidoEnum.EN_CAMINO_A_DESTINO, EstadoPedidoEnum.EN_CAMINO],
      [EstadoPedidoEnum.EN_CAMINO_A_DESTINO]: [EstadoPedidoEnum.EN_DESTINO],
      [EstadoPedidoEnum.EN_CAMINO]: [EstadoPedidoEnum.EN_DESTINO],
    };

    const permitidos = transicionesValidas[pedido.estado] || [];
    if (!permitidos.includes(nuevoEstado)) {
      throw new BadRequestException(
        `Transición no permitida de ${pedido.estado} a ${nuevoEstado}`,
      );
    }

    pedido.estado = nuevoEstado;
    await this.pedidoRepository.save(pedido);
    const completo = await this.findById(id);
    this.realtimeGateway.emitirPedidoActualizado(completo, 'ESTADO_AVANZADO');
    return completo;
  }

  async marcarListoDespacho(id: string, tiendaId: string): Promise<Pedido> {
    const pedido = await this.findById(id);
    if (pedido.tienda_id !== tiendaId) {
      throw new BadRequestException('Esta orden no pertenece a tu tienda.');
    }

    if (pedido.tipo_entrega === TipoEntregaEnum.RETIRO_TIENDA) {
      pedido.estado = EstadoPedidoEnum.LISTO_RETIRO;
    } else {
      pedido.estado = EstadoPedidoEnum.EN_PREPARACION;
    }

    await this.pedidoRepository.save(pedido);
    const completo = await this.findById(id);
    this.realtimeGateway.emitirPedidoActualizado(completo, 'LISTO_DESPACHO');
    return completo;
  }

  async confirmarEntregaConPin(id: string, dto: ConfirmarPinDto): Promise<Pedido> {
    const pedido = await this.findById(id);

    if (
      pedido.estado !== EstadoPedidoEnum.EN_DESTINO &&
      pedido.estado !== EstadoPedidoEnum.EN_CAMINO_A_DESTINO &&
      pedido.estado !== EstadoPedidoEnum.EN_CAMINO &&
      pedido.estado !== EstadoPedidoEnum.LISTO_RETIRO &&
      pedido.estado !== EstadoPedidoEnum.EN_PREPARACION &&
      pedido.estado !== EstadoPedidoEnum.EN_TIENDA
    ) {
      throw new BadRequestException(`El pedido no puede ser confirmado en su estado actual: ${pedido.estado}`);
    }

    if (pedido.pin_entrega !== dto.pin.trim()) {
      throw new BadRequestException('El PIN de seguridad ingresado es incorrecto.');
    }

    // Liberar escrow y descontar stock físicamente
    await this.repuestosService.descontarStockDefinitivo(pedido.repuesto_id, 1);

    pedido.estado = EstadoPedidoEnum.COMPLETADO;
    await this.pedidoRepository.save(pedido);
    const completo = await this.findById(id);
    this.realtimeGateway.emitirPedidoActualizado(completo, 'COMPLETADO');
    return completo;
  }

  async iniciarDisputa(id: string, dto: AbrirDisputaDto): Promise<Pedido> {
    const pedido = await this.findById(id);
    pedido.estado = EstadoPedidoEnum.DISPUTA;
    pedido.motivo_disputa = dto.motivo;
    await this.pedidoRepository.save(pedido);
    const completo = await this.findById(id);
    this.realtimeGateway.emitirPedidoActualizado(completo, 'DISPUTA_ABIERTA');
    return completo;
  }

  async reembolsarDisputa(id: string): Promise<Pedido> {
    const pedido = await this.findById(id);
    if (pedido.estado !== EstadoPedidoEnum.DISPUTA) {
      throw new BadRequestException('Solo se pueden reembolsar pedidos bajo estado de DISPUTA');
    }

    // Reintegrar stock al inventario de la tienda
    await this.repuestosService.liberarStock(pedido.repuesto_id, 1);

    pedido.estado = EstadoPedidoEnum.REEMBOLSADO;
    await this.pedidoRepository.save(pedido);
    const completo = await this.findById(id);
    this.realtimeGateway.emitirPedidoActualizado(completo, 'REEMBOLSADO');
    return completo;
  }

  async obtenerDisponiblesParaRepartidor(
    repartidorId: string,
    lat?: number,
    lon?: number,
  ): Promise<any[]> {
    const repartidor = await this.repartidoresService.findById(repartidorId);

    const pedidosPendientes = await this.pedidoRepository.find({
      where: {
        tipo_entrega: TipoEntregaEnum.DELIVERY_MOTO,
        estado: EstadoPedidoEnum.EN_PREPARACION,
      },
      relations: {
        repuesto: true,
        tienda: true,
        usuario_comprador: true,
      },
    });

    // Filtrar pedidos que coincidan con la capacidad del repartidor vía Strategy
    const strategy = this.logisticaContext.obtenerEstrategia(repartidor.tipo_vehiculo);
    const compatibles = pedidosPendientes.filter((p) => {
      if (!p.repuesto) return false;
      return strategy.puedeTransportar(p.repuesto.peso_kg, p.repuesto.tamano);
    });

    if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
      return compatibles
        .map((p) => {
          const distTiendaKm =
            p.tienda?.latitud && p.tienda?.longitud
              ? this.calcularDistanciaKm(lat, lon, p.tienda.latitud, p.tienda.longitud)
              : 0;
          return {
            ...p,
            distancia_repartidor_tienda_km: distTiendaKm,
          };
        })
        .sort((a, b) => a.distancia_repartidor_tienda_km - b.distancia_repartidor_tienda_km);
    }

    return compatibles;
  }

  async findAll(): Promise<Pedido[]> {
    return this.pedidoRepository.find({
      relations: {
        usuario_comprador: true,
        tienda: true,
        repuesto: true,
        repartidor: true,
      },
      order: { creado_en: 'DESC' },
    });
  }

  async findById(id: string): Promise<Pedido> {
    const ped = await this.pedidoRepository.findOne({
      where: { id },
      relations: {
        usuario_comprador: true,
        tienda: true,
        repuesto: true,
        repartidor: true,
      },
    });
    if (!ped) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }
    return ped;
  }

  async findByUsuarioId(usuarioId: string): Promise<Pedido[]> {
    return this.pedidoRepository.find({
      where: { usuario_comprador_id: usuarioId },
      relations: {
        tienda: true,
        repuesto: true,
        repartidor: true,
      },
      order: { creado_en: 'DESC' },
    });
  }

  async findByTiendaId(tiendaId: string): Promise<Pedido[]> {
    return this.pedidoRepository.find({
      where: { tienda_id: tiendaId },
      relations: {
        usuario_comprador: true,
        repuesto: true,
        repartidor: true,
      },
      order: { creado_en: 'DESC' },
    });
  }

  async findByRepartidorId(repartidorId: string): Promise<Pedido[]> {
    return this.pedidoRepository.find({
      where: { repartidor_id: repartidorId },
      relations: {
        usuario_comprador: true,
        repuesto: true,
        tienda: true,
      },
      order: { creado_en: 'DESC' },
    });
  }
}

