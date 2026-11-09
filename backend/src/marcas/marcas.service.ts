import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marca } from './entities/marca.entity';
import { CrearMarcaDto } from './dto/crear-marca.dto';

@Injectable()
export class MarcasService {
  constructor(
    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,
  ) {}

  async findAll(): Promise<Marca[]> {
    return this.marcaRepository.find({ order: { nombre: 'ASC' } });
  }

  async findById(id: number): Promise<Marca> {
    const marca = await this.marcaRepository.findOne({ where: { id } });
    if (!marca) {
      throw new NotFoundException(`Marca con ID ${id} no encontrada`);
    }
    return marca;
  }

  async findByNombre(nombre: string): Promise<Marca> {
    const marca = await this.marcaRepository.findOne({
      where: { nombre },
    });
    if (!marca) {
      throw new NotFoundException(`Marca ${nombre} no encontrada`);
    }
    return marca;
  }

  async crear(dto: CrearMarcaDto): Promise<Marca> {
    const nueva = this.marcaRepository.create(dto);
    return this.marcaRepository.save(nueva);
  }
}
