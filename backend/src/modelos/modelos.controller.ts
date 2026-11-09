import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ModelosService } from './modelos.service';
import { CrearModeloDto } from './dto/crear-modelo.dto';
import { Modelo } from './entities/modelo.entity';

@ApiTags('modelos')
@Controller('modelos')
export class ModelosController {
  constructor(private readonly modelosService: ModelosService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los modelos' })
  @ApiResponse({ status: 200, type: [Modelo] })
  async findAll(): Promise<Modelo[]> {
    return this.modelosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un modelo por su ID' })
  @ApiResponse({ status: 200, type: Modelo })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Modelo> {
    return this.modelosService.findById(id);
  }

  @Get('marca/:marcaId')
  @ApiOperation({ summary: 'Obtener modelos pertenecientes a una marca' })
  @ApiResponse({ status: 200, type: [Modelo] })
  async findByMarcaId(@Param('marcaId', ParseIntPipe) marcaId: number): Promise<Modelo[]> {
    return this.modelosService.findByMarcaId(marcaId);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo modelo' })
  @ApiResponse({ status: 201, type: Modelo })
  async create(@Body() dto: CrearModeloDto): Promise<Modelo> {
    return this.modelosService.create(dto);
  }
}

