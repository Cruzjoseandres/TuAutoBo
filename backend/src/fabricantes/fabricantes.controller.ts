import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FabricantesService } from './fabricantes.service';
import { CrearFabricanteDto } from './dto/crear-fabricante.dto';
import { Fabricante } from './entities/fabricante.entity';

@ApiTags('fabricantes')
@Controller('fabricantes')
export class FabricantesController {
  constructor(private readonly fabricantesService: FabricantesService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los fabricantes de repuestos' })
  @ApiResponse({ status: 200, type: [Fabricante] })
  async findAll(): Promise<Fabricante[]> {
    return this.fabricantesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un fabricante por su ID' })
  @ApiResponse({ status: 200, type: Fabricante })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Fabricante> {
    return this.fabricantesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo fabricante' })
  @ApiResponse({ status: 201, type: Fabricante })
  async create(@Body() dto: CrearFabricanteDto): Promise<Fabricante> {
    return this.fabricantesService.create(dto);
  }
}

