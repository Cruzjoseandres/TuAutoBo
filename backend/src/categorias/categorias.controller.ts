import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriasService } from './categorias.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { Categoria } from './entities/categoria.entity';

@ApiTags('categorias')
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las categorías de repuestos' })
  @ApiResponse({ status: 200, type: [Categoria] })
  async findAll(): Promise<Categoria[]> {
    return this.categoriasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por su ID' })
  @ApiResponse({ status: 200, type: Categoria })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Categoria> {
    return this.categoriasService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar una nueva categoría' })
  @ApiResponse({ status: 201, type: Categoria })
  async create(@Body() dto: CrearCategoriaDto): Promise<Categoria> {
    return this.categoriasService.create(dto);
  }
}

