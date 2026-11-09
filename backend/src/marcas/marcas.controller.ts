import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MarcasService } from './marcas.service';
import { CrearMarcaDto } from './dto/crear-marca.dto';
import type { Marca } from './entities/marca.entity';

@ApiTags('Marcas (Catálogo de Fabricantes de Autos)')
@Controller('marcas')
export class MarcasController {
  constructor(private readonly marcasService: MarcasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las marcas automotrices (Toyota, Suzuki, Nissan, etc.)' })
  findAll(): Promise<Marca[]> {
    return this.marcasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener marca por ID' })
  findById(@Param('id', ParseIntPipe) id: number): Promise<Marca> {
    return this.marcasService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva marca' })
  crear(@Body() dto: CrearMarcaDto): Promise<Marca> {
    return this.marcasService.crear(dto);
  }
}

