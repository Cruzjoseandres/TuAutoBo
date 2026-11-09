import { Controller, Get, Patch, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TipoCambioService } from './tipo-cambio.service';
import { ActualizarTipoCambioDto } from './dto/actualizar-tipo-cambio.dto';
import { TipoCambio } from './entities/tipo-cambio.entity';
import { MonedaEnum, RolEnum } from '../common/enums';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('tipo-cambio')
@Controller('tipo-cambio')
@UseGuards(RolesGuard)
export class TipoCambioController {
  constructor(private readonly tipoCambioService: TipoCambioService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener la cotización activa del dólar y boliviano' })
  @ApiResponse({ status: 200, type: TipoCambio })
  async obtenerRegistro(): Promise<TipoCambio> {
    return this.tipoCambioService.obtenerRegistro();
  }

  @Get('convertir')
  @ApiOperation({ summary: 'Convertir un monto entre USD y BOB con la tasa actual' })
  @ApiQuery({ name: 'monto', example: 100 })
  @ApiQuery({ name: 'de', enum: MonedaEnum, example: MonedaEnum.USD })
  @ApiQuery({ name: 'a', enum: MonedaEnum, example: MonedaEnum.BOB })
  async convertir(
    @Query('monto') monto: number,
    @Query('de') de: MonedaEnum,
    @Query('a') a: MonedaEnum,
  ) {
    return this.tipoCambioService.convertir(Number(monto), de, a);
  }

  @Patch()
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar manualmente la tasa de cambio (Solo Administrador)' })
  @ApiResponse({ status: 200, type: TipoCambio })
  async actualizarTasa(@Body() dto: ActualizarTipoCambioDto): Promise<TipoCambio> {
    return this.tipoCambioService.actualizarTasa(dto);
  }

  @Post('sincronizar')
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Sincronizar tasa de cambio en vivo desde API externa (Solo Administrador)' })
  @ApiResponse({ status: 200, type: TipoCambio })
  async sincronizar(): Promise<TipoCambio> {
    return this.tipoCambioService.sincronizarConApiExterna();
  }
}
