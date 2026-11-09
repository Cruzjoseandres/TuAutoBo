import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('parametros')
export class Parametro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  clave: string;

  @Column({ type: 'varchar', length: 150 })
  nombre_parametro: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'varchar', length: 255 })
  valor: string;

  @Column({ type: 'varchar', length: 50, default: 'NUMERO' })
  tipo_dato: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;
}

