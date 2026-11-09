import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './entities/categoria.entity';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  async findAll(): Promise<Categoria[]> {
    return this.categoriaRepository.find({ order: { nombre: 'ASC' } });
  }

  async findById(id: number): Promise<Categoria> {
    const cat = await this.categoriaRepository.findOne({ where: { id } });
    if (!cat) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
    return cat;
  }

  async create(dto: CrearCategoriaDto): Promise<Categoria> {
    const nueva = this.categoriaRepository.create(dto);
    return this.categoriaRepository.save(nueva);
  }
}
