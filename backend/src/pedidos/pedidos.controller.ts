import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PedidosService } from './pedidos.service';
import {
  CrearPedidoDto,
  CotizarEnvioDto,
  ConfirmarPagoDto,
  ConfirmarPinDto,
  AbrirDisputaDto,
} from './dto/crear-pedido.dto';
import { Pedido } from './entities/pedido.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolEnum, EstadoPedidoEnum } from '../common/enums';

@ApiTags('pedidos')
@Controller('pedidos')
@UseGuards(RolesGuard)
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los pedidos del marketplace' })
  @ApiResponse({ status: 200, type: [Pedido] })
  async findAll(): Promise<Pedido[]> {
    return this.pedidosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar estado en vivo y detalles de un pedido' })
  @ApiResponse({ status: 200, type: Pedido })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<Pedido> {
    return this.pedidosService.findById(id);
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({ summary: 'Historial de compras de un usuario' })
  @ApiResponse({ status: 200, type: [Pedido] })
  async findByUsuarioId(@Param('usuarioId', ParseUUIDPipe) usuarioId: string): Promise<Pedido[]> {
    return this.pedidosService.findByUsuarioId(usuarioId);
  }

  @Get('tienda/:tiendaId')
  @Roles(RolEnum.VENDEDOR, RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Listar órdenes recibidas por una tienda' })
  @ApiResponse({ status: 200, type: [Pedido] })
  async findByTiendaId(@Param('tiendaId', ParseUUIDPipe) tiendaId: string): Promise<Pedido[]> {
    return this.pedidosService.findByTiendaId(tiendaId);
  }

  @Get('repartidor/:repartidorId')
  @Roles(RolEnum.REPARTIDOR, RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Listar historial y pedidos asignados a un repartidor' })
  @ApiResponse({ status: 200, type: [Pedido] })
  async findByRepartidorId(
    @Param('repartidorId', ParseUUIDPipe) repartidorId: string,
  ): Promise<Pedido[]> {
    return this.pedidosService.findByRepartidorId(repartidorId);
  }

  @Get('disponibles-repartidor/:repartidorId')
  @Roles(RolEnum.REPARTIDOR, RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Pedidos en preparación compatibles con la capacidad del repartidor' })
  @ApiResponse({ status: 200, type: [Pedido] })
  async obtenerDisponiblesParaRepartidor(
    @Param('repartidorId', ParseUUIDPipe) repartidorId: string,
    @Query('lat') lat?: string,
    @Query('lon') lon?: string,
  ): Promise<any[]> {
    const latNum = lat ? parseFloat(lat) : undefined;
    const lonNum = lon ? parseFloat(lon) : undefined;
    return this.pedidosService.obtenerDisponiblesParaRepartidor(repartidorId, latNum, lonNum);
  }

  @Post('cotizar-envio')
  @ApiOperation({ summary: 'Calcular el flete exacto de envío antes de pagar' })
  async cotizarEnvio(@Body() dto: CotizarEnvioDto) {
    return this.pedidosService.cotizarEnvio(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un pedido, reservar stock y generar QR Simple con custodia escrow' })
  @ApiResponse({ status: 201, type: Pedido })
  async crearPedido(@Body() dto: CrearPedidoDto): Promise<Pedido> {
    return this.pedidosService.crearPedido(dto);
  }

  @Post(':id/confirmar-pago')
  @ApiOperation({ summary: 'Confirmar recepción del pago QR bancario y retener en escrow' })
  @ApiResponse({ status: 200, type: Pedido })
  async confirmarPago(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmarPagoDto,
  ): Promise<Pedido> {
    return this.pedidosService.confirmarPagoQr(id, dto);
  }

  @Post(':id/asignar-repartidor')
  @Roles(RolEnum.REPARTIDOR, RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Asignar un repartidor para entrega a domicilio' })
  @ApiResponse({ status: 200, type: Pedido })
  async asignarRepartidor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('repartidor_id') repartidorId: string,
  ): Promise<Pedido> {
    return this.pedidosService.asignarRepartidor(id, repartidorId);
  }

  @Post(':id/avanzar-estado-repartidor')
  @Roles(RolEnum.REPARTIDOR, RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Avanzar estado del repartidor (One-tap: a tienda, en tienda, a destino, en destino)' })
  @ApiResponse({ status: 200, type: Pedido })
  async avanzarEstadoRepartidor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('repartidor_id') repartidorId: string,
    @Body('nuevo_estado') nuevoEstado: EstadoPedidoEnum,
  ): Promise<Pedido> {
    return this.pedidosService.avanzarEstadoRepartidor(id, repartidorId, nuevoEstado);
  }

  @Post(':id/marcar-listo-despacho')
  @Roles(RolEnum.VENDEDOR, RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Marcar paquete listo para despacho o retiro en mostrador' })
  @ApiResponse({ status: 200, type: Pedido })
  async marcarListoDespacho(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('tienda_id') tiendaId: string,
  ): Promise<Pedido> {
    return this.pedidosService.marcarListoDespacho(id, tiendaId);
  }

  @Post(':id/confirmar-entrega-pin')
  @ApiOperation({ summary: 'Validar PIN de 4 dígitos en entrega y liberar fondos de custodia escrow a la tienda' })
  @ApiResponse({ status: 200, type: Pedido })
  async confirmarEntregaPin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmarPinDto,
  ): Promise<Pedido> {
    return this.pedidosService.confirmarEntregaConPin(id, dto);
  }

  @Post(':id/disputa')
  @ApiOperation({ summary: 'Abrir disputa si el repuesto recibido no es compatible' })
  @ApiResponse({ status: 200, type: Pedido })
  async iniciarDisputa(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AbrirDisputaDto,
  ): Promise<Pedido> {
    return this.pedidosService.iniciarDisputa(id, dto);
  }

  @Post(':id/reembolsar')
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Reembolsar pedido en disputa y reintegrar stock a la tienda (Solo Administrador)' })
  @ApiResponse({ status: 200, type: Pedido })
  async reembolsar(@Param('id', ParseUUIDPipe) id: string): Promise<Pedido> {
    return this.pedidosService.reembolsarDisputa(id);
  }
}
