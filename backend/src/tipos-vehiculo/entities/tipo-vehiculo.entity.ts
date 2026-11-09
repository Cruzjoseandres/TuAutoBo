import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TamanoRepuestoEnum } from '../../common/enums';

@Entity('tipos_vehiculo')
export class TipoVehiculo {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 40, unique: true })
  codigo: string; // 'MOTOCICLETA', 'TORITO_MOTOCARRO', 'AUTOMOVIL', 'CAMIONETA'

  @Column({ type: 'varchar', length: 60 })
  nombre: string; // 'Motocicleta Express', 'Torito / Motocarro', 'Automóvil / Furgoneta', 'Camioneta Utilitaria'

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string;

  @Column({ type: 'float', default: 0.1 })
  peso_min_kg: number;

  @Column({ type: 'float', default: 20.0 })
  peso_max_kg: number;

  @Column({
    type: 'enum',
    enum: TamanoRepuestoEnum,
    default: TamanoRepuestoEnum.PEQUENO,
  })
  tamano_maximo: TamanoRepuestoEnum;

  @Column({ type: 'float', default: 10.0 })
  tarifa_base_bs: number;

  @Column({ type: 'float', default: 2.0 })
  precio_km_adicional_bs: number;

  @Column({ type: 'varchar', length: 50, default: 'truck' })
  icono_svg: string;

  @Column({ type: 'int', default: 1 })
  orden_visual: number;

  @Column({ type: 'boolean', default: true })
  esta_activo: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;
}

