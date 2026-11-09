import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Marca } from '../../marcas/entities/marca.entity';

@Entity('modelos')
export class Modelo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @ManyToOne(() => Marca, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'marca_id' })
  marca: Marca;

  @Column({ name: 'marca_id' })
  marca_id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;
}

