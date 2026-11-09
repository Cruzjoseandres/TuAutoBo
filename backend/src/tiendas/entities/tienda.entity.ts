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
import { PlanTiendaEnum, TipoEstablecimientoEnum } from '../../common/enums';

@Entity('tiendas')
export class Tienda {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TipoEstablecimientoEnum,
    default: TipoEstablecimientoEnum.TIENDA_REPUESTOS,
  })
  tipo_establecimiento: TipoEstablecimientoEnum;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'double precision' })
  latitud: number;

  @Column({ type: 'double precision' })
  longitud: number;

  @Column({ type: 'text' })
  direccion_escrita: string;

  @Column({ type: 'text', nullable: true })
  referencia: string;

  @Column({ type: 'varchar', length: 30 })
  telefono: string;

  @Column({ type: 'varchar', length: 40, default: '1029485012' })
  nit: string;

  @Column({ type: 'varchar', length: 120, default: 'Lun a Sáb: 08:00 - 19:00' })
  horario_atencion: string;

  @Column({ type: 'int', default: 25 })
  tiempo_preparacion_min: number;

  @Column({ type: 'text', default: 'Repuestos Japoneses y Multimarcas' })
  especialidad: string;

  @Column({ type: 'text', nullable: true })
  servicios_taller: string | null;

  @Column({ type: 'float', default: 0.0 })
  calificacion: number;

  @Column({ type: 'int', default: 0 })
  total_resenas: number;

  @Column({ type: 'boolean', default: true })
  esta_verificada: boolean;

  @Column({
    type: 'enum',
    enum: PlanTiendaEnum,
    default: PlanTiendaEnum.GRATUITO,
  })
  plan_suscripcion: PlanTiendaEnum;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id' })
  usuario_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;
}

