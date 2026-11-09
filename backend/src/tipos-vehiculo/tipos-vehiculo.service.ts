import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoVehiculo } from './entities/tipo-vehiculo.entity';
import { TamanoRepuestoEnum } from '../common/enums';

@Injectable()
export class TiposVehiculoService {
  constructor(
    @InjectRepository(TipoVehiculo)
    private readonly repo: Repository<TipoVehiculo>,
  ) {}

  async findAll(): Promise<TipoVehiculo[]> {
    return this.repo.find({
      where: { esta_activo: true },
      order: { orden_visual: 'ASC', id: 'ASC' },
    });
  }

  async findById(id: number): Promise<TipoVehiculo> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Tipo de vehículo con ID ${id} no encontrado.`);
    }
    return item;
  }

  async findByCodigo(codigo: string): Promise<TipoVehiculo | null> {
    return this.repo.findOne({ where: { codigo } });
  }

  async seedDefault(): Promise<TipoVehiculo[]> {
    const count = await this.repo.count();
    if (count > 0) {
      return this.findAll();
    }

    const items: Partial<TipoVehiculo>[] = [
      {
        codigo: 'MOTOCICLETA',
        nombre: 'Motocicleta Express',
        descripcion: 'Ideal para filtros, bujías, sensores y repuestos ligeros hasta 20 kg.',
        peso_min_kg: 0.1,
        peso_max_kg: 20.0,
        tamano_maximo: TamanoRepuestoEnum.PEQUENO,
        tarifa_base_bs: 10.0,
        precio_km_adicional_bs: 2.0,
        icono_svg: 'moto',
        orden_visual: 1,
        esta_activo: true,
      },
      {
        codigo: 'TORITO_MOTOCARRO',
        nombre: 'Torito / Motocarro',
        descripcion: 'Apto para discos de freno, alternadores, amortiguadores hasta 60 kg.',
        peso_min_kg: 0.5,
        peso_max_kg: 60.0,
        tamano_maximo: TamanoRepuestoEnum.MEDIANO,
        tarifa_base_bs: 15.0,
        precio_km_adicional_bs: 2.5,
        icono_svg: 'torito',
        orden_visual: 2,
        esta_activo: true,
      },
      {
        codigo: 'AUTOMOVIL',
        nombre: 'Automóvil / Furgoneta',
        descripcion: 'Capacidad amplia para parabrisas, radiadores y bultos grandes hasta 80 kg.',
        peso_min_kg: 0.5,
        peso_max_kg: 80.0,
        tamano_maximo: TamanoRepuestoEnum.GRANDE,
        tarifa_base_bs: 20.0,
        precio_km_adicional_bs: 3.0,
        icono_svg: 'auto',
        orden_visual: 3,
        esta_activo: true,
      },
      {
        codigo: 'CAMIONETA',
        nombre: 'Camioneta Utilitaria',
        descripcion: 'Carga pesada para motores, transmisiones, ejes y suspensiones completas hasta 250 kg.',
        peso_min_kg: 1.0,
        peso_max_kg: 250.0,
        tamano_maximo: TamanoRepuestoEnum.GRANDE,
        tarifa_base_bs: 35.0,
        precio_km_adicional_bs: 4.0,
        icono_svg: 'camioneta',
        orden_visual: 4,
        esta_activo: true,
      },
    ];

    const guardados: TipoVehiculo[] = [];
    for (const item of items) {
      const v = this.repo.create(item);
      guardados.push(await this.repo.save(v));
    }
    return guardados;
  }
}

