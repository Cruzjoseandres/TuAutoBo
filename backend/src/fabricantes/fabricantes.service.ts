import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fabricante } from './entities/fabricante.entity';
import { CrearFabricanteDto } from './dto/crear-fabricante.dto';

@Injectable()
export class FabricantesService {
  constructor(
    @InjectRepository(Fabricante)
    private readonly fabricanteRepository: Repository<Fabricante>,
  ) {}

  async findAll(): Promise<Fabricante[]> {
    return this.fabricanteRepository.find({ order: { nombre: 'ASC' } });
  }

  async findById(id: number): Promise<Fabricante> {
    const fab = await this.fabricanteRepository.findOne({ where: { id } });
    if (!fab) {
      throw new NotFoundException(`Fabricante con ID ${id} no encontrado`);
    }
    return fab;
  }

  async create(dto: CrearFabricanteDto): Promise<Fabricante> {
    const nuevo = this.fabricanteRepository.create(dto);
    return this.fabricanteRepository.save(nuevo);
  }
}
