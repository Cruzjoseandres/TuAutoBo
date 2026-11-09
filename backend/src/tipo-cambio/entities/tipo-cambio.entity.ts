import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { MonedaEnum } from '../../common/enums';

@Entity('tipo_cambio')
export class TipoCambio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: MonedaEnum,
    default: MonedaEnum.USD,
  })
  moneda_origen: MonedaEnum;

  @Column({
    type: 'enum',
    enum: MonedaEnum,
    default: MonedaEnum.BOB,
  })
  moneda_destino: MonedaEnum;

  @Column({ type: 'float', default: 6.96 })
  tasa_cambio: number;

  @Column({ type: 'varchar', length: 100, default: 'BCB Oficial / Open Exchange' })
  fuente: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;
}

