import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RepuestosService } from './repuestos.service';
import { CrearRepuestoDto } from './dto/crear-repuesto.dto';
import { ActualizarRepuestoDto } from './dto/actualizar-repuesto.dto';
import { FiltrarRepuestosDto } from './dto/filtrar-repuestos.dto';
import { Repuesto } from './entities/repuesto.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolEnum } from '../common/enums';

@ApiTags('repuestos')
@Controller('repuestos')
@UseGuards(RolesGuard)
export class RepuestosController {
  constructor(private readonly repuestosService: RepuestosService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener repuestos con filtros por vehículo, categoría y texto (paginado SQL)' })
  @ApiResponse({ status: 200, type: [Repuesto] })
  async buscar(@Query() filtros: FiltrarRepuestosDto): Promise<Repuesto[]> {
    return this.repuestosService.buscar(filtros);
  }

  @Get('paginado')
  @ApiOperation({ summary: 'Búsqueda paginada en servidor con conteo total por categoría/vehículo' })
  async buscarPaginado(@Query() filtros: FiltrarRepuestosDto) {
    return this.repuestosService.buscarPaginado(filtros);
  }

  @Get('tienda/:tiendaId')
  @ApiOperation({ summary: 'Obtener catálogo de repuestos de una tienda específica' })
  @ApiResponse({ status: 200, type: [Repuesto] })
  async findByTiendaId(@Param('tiendaId', ParseUUIDPipe) tiendaId: string): Promise<Repuesto[]> {
    return this.repuestosService.findByTiendaId(tiendaId);
  }

  @Get(':id/resenas')
  @ApiOperation({ summary: 'Obtener calificaciones y comentarios verificados de un repuesto' })
  async obtenerResenas(@Param('id', ParseUUIDPipe) id: string) {
    return this.repuestosService.obtenerResenas(id);
  }

  @Post(':id/resenas')
  @ApiOperation({ summary: 'Registrar una nueva calificación y reseña sobre un repuesto' })
  async crearResena(@Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.repuestosService.crearResena(id, body);
  }

  @Get(':id/otras-tiendas')
  @ApiOperation({ summary: 'Obtener otras tiendas que venden el mismo número de parte OEM activo' })
  async buscarOtrasTiendas(@Param('id', ParseUUIDPipe) id: string) {
    return this.repuestosService.buscarOtrasTiendas(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle técnico completo de un repuesto (sanitizado para comprador)' })
  @ApiResponse({ status: 200, type: Repuesto })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return this.repuestosService.findByIdPublico(id);
  }

  @Post()
  @Roles(RolEnum.VENDEDOR, RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Publicar un nuevo repuesto en el catálogo (Tienda o Admin)' })
  @ApiResponse({ status: 201, type: Repuesto })
  async create(@Body() dto: CrearRepuestoDto): Promise<Repuesto> {
    return this.repuestosService.create(dto);
  }

  @Patch(':id')
  @Roles(RolEnum.VENDEDOR, RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar datos técnicos, precio o inventario de un repuesto' })
  @ApiResponse({ status: 200, type: Repuesto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarRepuestoDto,
  ): Promise<Repuesto> {
    return this.repuestosService.update(id, dto);
  }

  @Patch(':id/toggle-activo')
  @Roles(RolEnum.VENDEDOR, RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Habilitar o pausar publicación de un repuesto en el catálogo' })
  @ApiResponse({ status: 200, type: Repuesto })
  async toggleActivo(@Param('id', ParseUUIDPipe) id: string): Promise<Repuesto> {
    return this.repuestosService.toggleActivo(id);
  }

  @Post(':id/boost')
  @Roles(RolEnum.VENDEDOR, RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Activar destaque prioritario (boost) para un repuesto' })
  @ApiResponse({ status: 200, type: Repuesto })
  async activarBoost(@Param('id', ParseUUIDPipe) id: string): Promise<Repuesto> {
    return this.repuestosService.activarBoost(id);
  }
}
