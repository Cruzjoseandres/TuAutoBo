import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { RolEnum } from '../common/enums';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  async findAll(): Promise<Rol[]> {
    return this.rolRepository.find();
  }

  async findByNombre(nombre: RolEnum): Promise<Rol> {
    const rol = await this.rolRepository.findOne({ where: { nombre } });
    if (!rol) {
      throw new NotFoundException(`Rol ${nombre} no encontrado`);
    }
    return rol;
  }
}
