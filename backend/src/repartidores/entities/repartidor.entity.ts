import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { TipoVehiculo } from '../../tipos-vehiculo/entities/tipo-vehiculo.entity';
import { TipoVehiculoEnum, TamanoRepuestoEnum } from '../../common/enums';

@Entity('repartidores')
export class Repartidor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id' })
  usuario_id: string;

  @ManyToOne(() => TipoVehiculo, { eager: true, nullable: true })
  @JoinColumn({ name: 'tipo_vehiculo_id' })
  tipo_vehiculo_rel: TipoVehiculo;

  @Column({ name: 'tipo_vehiculo_id', nullable: true })
  tipo_vehiculo_id: number;

  @Column({
    type: 'enum',
    enum: TipoVehiculoEnum,
    default: TipoVehiculoEnum.MOTOCICLETA,
  })
  tipo_vehiculo: TipoVehiculoEnum;

  @Column({ type: 'varchar', length: 20 })
  placa: string;

  @Column({ type: 'varchar', length: 40, default: 'SCZ-8492011' })
  licencia_conducir: string;

  @Column({ type: 'float', default: 0.1 })
  capacidad_peso_min_kg: number;

  @Column({ type: 'float', default: 20.0 })
  capacidad_peso_max_kg: number;

  @Column({
    type: 'enum',
    enum: TamanoRepuestoEnum,
    default: TamanoRepuestoEnum.MEDIANO,
  })
  tamano_maximo: TamanoRepuestoEnum;

  @Column({ type: 'double precision', default: -17.7812 })
  latitud_actual: number;

  @Column({ type: 'double precision', default: -63.1804 })
  longitud_actual: number;

  @Column({ type: 'boolean', default: true })
  esta_activo: boolean;

  @Column({ type: 'boolean', default: true })
  esta_verificado: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;
}

