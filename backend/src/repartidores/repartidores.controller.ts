import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RepartidoresService } from './repartidores.service';
import { CrearRepartidorDto } from './dto/crear-repartidor.dto';
import { Repartidor } from './entities/repartidor.entity';
import { RolEnum } from '../common/enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('repartidores')
@Controller('repartidores')
@UseGuards(RolesGuard)
export class RepartidoresController {
  constructor(private readonly repartidoresService: RepartidoresService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los repartidores registrados' })
  @ApiResponse({ status: 200, type: [Repartidor] })
  async findAll(): Promise<Repartidor[]> {
    return this.repartidoresService.findAll();
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({ summary: 'Obtener perfil de repartidor por ID de usuario' })
  @ApiResponse({ status: 200, type: Repartidor })
  async findByUsuarioId(@Param('usuarioId', ParseUUIDPipe) usuarioId: string): Promise<Repartidor> {
    return this.repartidoresService.findByUsuarioId(usuarioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un repartidor por su ID' })
  @ApiResponse({ status: 200, type: Repartidor })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<Repartidor> {
    return this.repartidoresService.findById(id);
  }

  @Post('solicitud-registro')
  @ApiOperation({ summary: 'Enviar solicitud de afiliación de nuevo repartidor logístico (sujeta a aprobación)' })
  @ApiResponse({ status: 201, type: Repartidor })
  async registrarSolicitudRepartidor(@Body() body: any): Promise<Repartidor> {
    return this.repartidoresService.registrarSolicitudRepartidor(body);
  }

  @Patch(':id/aprobar')
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Aprobar solicitud de repartidor y activar cuenta (Solo Administrador)' })
  async aprobarRepartidor(@Param('id', ParseUUIDPipe) id: string): Promise<Repartidor> {
    return this.repartidoresService.aprobarRepartidor(id);
  }

  @Patch(':id/rechazar')
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Rechazar solicitud de repartidor (Solo Administrador)' })
  async rechazarRepartidor(@Param('id', ParseUUIDPipe) id: string): Promise<Repartidor> {
    return this.repartidoresService.rechazarRepartidor(id);
  }

  @Post()
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Registrar un nuevo repartidor con capacidades vehiculares' })
  @ApiResponse({ status: 201, type: Repartidor })
  async create(@Body() dto: CrearRepartidorDto): Promise<Repartidor> {
    return this.repartidoresService.create(dto);
  }

  @Patch(':id/ubicacion')
  @Roles(RolEnum.REPARTIDOR, RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar coordenadas GPS del repartidor' })
  @ApiResponse({ status: 200, type: Repartidor })
  async actualizarUbicacion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('latitud') latitud: number,
    @Body('longitud') longitud: number,
  ): Promise<Repartidor> {
    return this.repartidoresService.actualizarUbicacion(id, latitud, longitud);
  }

  @Patch(':id/estado-activo')
  @Roles(RolEnum.REPARTIDOR, RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Activar o pausar turno del repartidor' })
  @ApiResponse({ status: 200, type: Repartidor })
  async cambiarEstadoActivo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('esta_activo') estaActivo: boolean,
  ): Promise<Repartidor> {
    return this.repartidoresService.cambiarEstadoActivo(id, estaActivo);
  }

  @Patch(':id/capacidad')
  @Roles(RolEnum.REPARTIDOR, RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar capacidad mínima, máxima y tamaño de carga del repartidor' })
  @ApiResponse({ status: 200, type: Repartidor })
  async actualizarCapacidad(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('capacidad_peso_min_kg') capacidadMin: number,
    @Body('capacidad_peso_max_kg') capacidadMax: number,
    @Body('tamano_maximo') tamanoMaximo: any,
  ): Promise<Repartidor> {
    return this.repartidoresService.actualizarCapacidad(id, capacidadMin, capacidadMax, tamanoMaximo);
  }
}
