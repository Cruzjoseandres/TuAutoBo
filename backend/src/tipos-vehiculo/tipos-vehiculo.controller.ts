import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TiposVehiculoService } from './tipos-vehiculo.service';
import { TipoVehiculo } from './entities/tipo-vehiculo.entity';

@ApiTags('tipos-vehiculo')
@Controller('tipos-vehiculo')
export class TiposVehiculoController {
  constructor(private readonly service: TiposVehiculoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los tipos de vehículo activos para despacho y repartidores' })
  @ApiResponse({ status: 200, description: 'Catálogo de vehículos disponibles.', type: [TipoVehiculo] })
  async findAll(): Promise<TipoVehiculo[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de vehículo por su ID numérico' })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<TipoVehiculo> {
    return this.service.findById(id);
  }

  @Get('codigo/:codigo')
  @ApiOperation({ summary: 'Obtener un tipo de vehículo por su código textual' })
  async findByCodigo(@Param('codigo') codigo: string): Promise<TipoVehiculo | null> {
    return this.service.findByCodigo(codigo);
  }
}

