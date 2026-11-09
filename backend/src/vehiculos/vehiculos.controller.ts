import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VehiculosService } from './vehiculos.service';
import { CrearVehiculoDto } from './dto/crear-vehiculo.dto';
import { Vehiculo } from './entities/vehiculo.entity';

@ApiTags('vehiculos')
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los vehículos configurados' })
  @ApiResponse({ status: 200, type: [Vehiculo] })
  async findAll(): Promise<Vehiculo[]> {
    return this.vehiculosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un vehículo por su ID' })
  @ApiResponse({ status: 200, type: Vehiculo })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Vehiculo> {
    return this.vehiculosService.findById(id);
  }

  @Get('modelo/:modeloId')
  @ApiOperation({ summary: 'Obtener vehículos por modelo' })
  @ApiResponse({ status: 200, type: [Vehiculo] })
  async findByModeloId(@Param('modeloId', ParseIntPipe) modeloId: number): Promise<Vehiculo[]> {
    return this.vehiculosService.findByModeloId(modeloId);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar una nueva configuración de vehículo' })
  @ApiResponse({ status: 201, type: Vehiculo })
  async create(@Body() dto: CrearVehiculoDto): Promise<Vehiculo> {
    return this.vehiculosService.create(dto);
  }
}

