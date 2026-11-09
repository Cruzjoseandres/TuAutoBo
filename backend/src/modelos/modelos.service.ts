import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modelo } from './entities/modelo.entity';
import { CrearModeloDto } from './dto/crear-modelo.dto';
import { MarcasService } from '../marcas/marcas.service';

@Injectable()
export class ModelosService {
  constructor(
    @InjectRepository(Modelo)
    private readonly modeloRepository: Repository<Modelo>,
    private readonly marcasService: MarcasService,
  ) {}

  async findAll(): Promise<Modelo[]> {
    return this.modeloRepository.find({
      relations: { marca: true },
      order: { nombre: 'ASC' },
    });
  }

  async findById(id: number): Promise<Modelo> {
    const modelo = await this.modeloRepository.findOne({
      where: { id },
      relations: { marca: true },
    });
    if (!modelo) {
      throw new NotFoundException(`Modelo con ID ${id} no encontrado`);
    }
    return modelo;
  }

  async findByMarcaId(marcaId: number): Promise<Modelo[]> {
    return this.modeloRepository.find({
      where: { marca_id: marcaId },
      relations: { marca: true },
      order: { nombre: 'ASC' },
    });
  }

  async create(dto: CrearModeloDto): Promise<Modelo> {
    await this.marcasService.findById(dto.marca_id);
    const nuevo = this.modeloRepository.create(dto);
    return this.modeloRepository.save(nuevo);
  }
}
