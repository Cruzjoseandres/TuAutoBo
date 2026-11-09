import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Rol } from '../../roles/entities/rol.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  correo: string;

  @Column({ select: false })
  clave: string;

  @Column()
  nombre_completo: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ type: 'varchar', length: 30, default: 'ACTIVO' })
  estado_cuenta: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  ciudad_zona: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  direcciones: Array<{
    id: string;
    alias: string;
    direccion_escrita: string;
    referencia?: string;
    latitud: number;
    longitud: number;
    es_predeterminada?: boolean;
  }>;

  @ManyToMany(() => Rol, { eager: true, cascade: true })
  @JoinTable({
    name: 'usuarios_roles',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'rol_id', referencedColumnName: 'id' },
  })
  roles: Rol[];

  @CreateDateColumn()
  creado_en: Date;
}

