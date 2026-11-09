import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Tienda } from '../../tiendas/entities/tienda.entity';
import { Repuesto } from '../../repuestos/entities/repuesto.entity';

@Entity('mensajes')
export class Mensaje {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  texto: string;

  @Column({ type: 'text', nullable: true })
  url_imagen: string | null;

  @Column({ type: 'boolean', default: false })
  es_confirmacion_compatibilidad: boolean;

  @Column({ type: 'varchar', length: 30, default: 'COMPRADOR' })
  remitente_tipo: string;

  @Column({ type: 'varchar', length: 150 })
  remitente_nombre: string;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id' })
  usuario_id: string;

  @ManyToOne(() => Tienda, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'tienda_id' })
  tienda: Tienda;

  @Column({ name: 'tienda_id' })
  tienda_id: string;

  @ManyToOne(() => Repuesto, { onDelete: 'SET NULL', nullable: true, eager: true })
  @JoinColumn({ name: 'repuesto_id' })
  repuesto: Repuesto | null;

  @Column({ name: 'repuesto_id', nullable: true })
  repuesto_id: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;
}

