import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ParametrosService } from './parametros.service';
import { ActualizarParametroDto, CrearParametroDto } from './dto/actualizar-parametro.dto';
import { Parametro } from './entities/parametro.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { RolEnum } from '../common/enums';

@ApiTags('parametros')
@Controller('parametros')
@UseGuards(RolesGuard)
export class ParametrosController {
  constructor(private readonly parametrosService: ParametrosService) {}

  @Get()
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Listar todos los parámetros del sistema (Solo Administrador)' })
  @ApiResponse({ status: 200, type: [Parametro] })
  async findAll(): Promise<Parametro[]> {
    return this.parametrosService.findAll();
  }

  @Get(':clave')
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtener el valor y descripción de un parámetro específico' })
  @ApiResponse({ status: 200, type: Parametro })
  async findByClave(@Param('clave') clave: string): Promise<Parametro> {
    return this.parametrosService.findByClave(clave);
  }

  @Patch(':clave')
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar el valor de un parámetro del negocio' })
  @ApiResponse({ status: 200, type: Parametro })
  async actualizar(
    @Param('clave') clave: string,
    @Body() dto: ActualizarParametroDto,
  ): Promise<Parametro> {
    return this.parametrosService.actualizar(clave, dto);
  }

  @Post()
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear un nuevo parámetro configurable' })
  @ApiResponse({ status: 201, type: Parametro })
  async create(@Body() dto: CrearParametroDto): Promise<Parametro> {
    return this.parametrosService.create(dto);
  }
}

