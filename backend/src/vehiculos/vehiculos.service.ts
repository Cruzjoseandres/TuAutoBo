import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { CrearVehiculoDto } from './dto/crear-vehiculo.dto';
import { ModelosService } from '../modelos/modelos.service';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepository: Repository<Vehiculo>,
    private readonly modelosService: ModelosService,
  ) {}

  async findAll(): Promise<Vehiculo[]> {
    return this.vehiculoRepository.find({
      relations: { modelo: { marca: true } },
      order: { anio: 'DESC' },
    });
  }

  async findById(id: number): Promise<Vehiculo> {
    const vehiculo = await this.vehiculoRepository.findOne({
      where: { id },
      relations: { modelo: { marca: true } },
    });
    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
    }
    return vehiculo;
  }

  async findByModeloId(modeloId: number): Promise<Vehiculo[]> {
    return this.vehiculoRepository.find({
      where: { modelo_id: modeloId },
      relations: { modelo: { marca: true } },
      order: { anio: 'DESC' },
    });
  }

  async create(dto: CrearVehiculoDto): Promise<Vehiculo> {
    await this.modelosService.findById(dto.modelo_id);
    const nuevo = this.vehiculoRepository.create(dto);
    return this.vehiculoRepository.save(nuevo);
  }
}
