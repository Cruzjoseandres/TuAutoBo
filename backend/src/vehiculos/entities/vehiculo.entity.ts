import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Modelo } from '../../modelos/entities/modelo.entity';
import { TipoCombustibleEnum, TipoTransmisionEnum } from '../../common/enums';

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  anio: number;

  @Column({ type: 'varchar', length: 100 })
  motor: string;

  @Column({ type: 'varchar', length: 50 })
  cilindrada: string;

  @Column({
    type: 'enum',
    enum: TipoCombustibleEnum,
    default: TipoCombustibleEnum.GASOLINA,
  })
  tipo_combustible: TipoCombustibleEnum;

  @Column({
    type: 'enum',
    enum: TipoTransmisionEnum,
    default: TipoTransmisionEnum.AUTOMATICA,
  })
  transmision: TipoTransmisionEnum;

  @ManyToOne(() => Modelo, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'modelo_id' })
  modelo: Modelo;

  @Column({ name: 'modelo_id' })
  modelo_id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;
}

