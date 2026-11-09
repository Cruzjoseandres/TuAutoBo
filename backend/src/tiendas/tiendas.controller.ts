import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TiendasService } from './tiendas.service';
import { CrearTiendaDto } from './dto/crear-tienda.dto';
import { Tienda } from './entities/tienda.entity';
import { PlanTiendaEnum, RolEnum } from '../common/enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('tiendas')
@Controller('tiendas')
@UseGuards(RolesGuard)
export class TiendasController {
  constructor(private readonly tiendasService: TiendasService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las tiendas registradas' })
  @ApiResponse({ status: 200, type: [Tienda] })
  async findAll(): Promise<Tienda[]> {
    return this.tiendasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una tienda por su ID' })
  @ApiResponse({ status: 200, type: Tienda })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<Tienda> {
    return this.tiendasService.findById(id);
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({ summary: 'Obtener tiendas asociadas a un usuario' })
  @ApiResponse({ status: 200, type: [Tienda] })
  async findByUsuarioId(@Param('usuarioId', ParseUUIDPipe) usuarioId: string): Promise<Tienda[]> {
    return this.tiendasService.findByUsuarioId(usuarioId);
  }

  @Post()
  @Roles(RolEnum.VENDEDOR, RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Registrar una nueva tienda' })
  @ApiResponse({ status: 201, type: Tienda })
  async create(@Body() dto: CrearTiendaDto): Promise<Tienda> {
    return this.tiendasService.create(dto);
  }

  @Post('solicitud-registro')
  @ApiOperation({ summary: 'Enviar solicitud de afiliación de nueva tienda repuestera (sujeta a aprobación)' })
  @ApiResponse({ status: 201, type: Tienda })
  async registrarSolicitudTienda(@Body() body: any): Promise<Tienda> {
    return this.tiendasService.registrarSolicitudTienda(body);
  }

  @Patch(':id/aprobar')
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Aprobar solicitud de tienda y activar usuario vendedor (Solo Administrador)' })
  async aprobarTienda(@Param('id', ParseUUIDPipe) id: string): Promise<Tienda> {
    return this.tiendasService.aprobarTienda(id);
  }

  @Patch(':id/rechazar')
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Rechazar solicitud de tienda (Solo Administrador)' })
  async rechazarTienda(@Param('id', ParseUUIDPipe) id: string): Promise<Tienda> {
    return this.tiendasService.rechazarTienda(id);
  }

  @Patch(':id/plan')
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar el plan de suscripción de la tienda (Solo Administrador)' })
  @ApiResponse({ status: 200, type: Tienda })
  async actualizarPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('plan') plan: PlanTiendaEnum,
  ): Promise<Tienda> {
    return this.tiendasService.actualizarPlan(id, plan);
  }
}
