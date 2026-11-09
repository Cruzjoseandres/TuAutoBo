import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MensajesService } from './mensajes.service';
import { CrearMensajeDto } from './dto/crear-mensaje.dto';
import { Mensaje } from './entities/mensaje.entity';

@ApiTags('mensajes')
@Controller('mensajes')
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  @Post()
  @ApiOperation({ summary: 'Enviar mensaje de consulta técnica o confirmación de compatibilidad' })
  @ApiResponse({ status: 201, type: Mensaje })
  async crearMensaje(@Body() dto: CrearMensajeDto): Promise<Mensaje> {
    return this.mensajesService.crearMensaje(dto);
  }

  @Get('chat')
  @ApiOperation({ summary: 'Obtener historial de mensajes entre un comprador y una tienda' })
  @ApiQuery({ name: 'usuario_id', type: String })
  @ApiQuery({ name: 'tienda_id', type: String })
  @ApiQuery({ name: 'repuesto_id', type: String, required: false })
  @ApiResponse({ status: 200, type: [Mensaje] })
  async obtenerHistorialChat(
    @Query('usuario_id', ParseUUIDPipe) usuarioId: string,
    @Query('tienda_id', ParseUUIDPipe) tiendaId: string,
    @Query('repuesto_id') repuestoId?: string,
  ): Promise<Mensaje[]> {
    return this.mensajesService.obtenerHistorialChat(usuarioId, tiendaId, repuestoId);
  }

  @Get('tienda/:tiendaId')
  @ApiOperation({ summary: 'Bandeja de entrada de mensajes para la tienda' })
  @ApiResponse({ status: 200, type: [Mensaje] })
  async obtenerConversacionesTienda(
    @Param('tiendaId', ParseUUIDPipe) tiendaId: string,
  ): Promise<Mensaje[]> {
    return this.mensajesService.obtenerConversacionesTienda(tiendaId);
  }
}

