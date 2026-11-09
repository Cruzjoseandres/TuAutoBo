import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { Fabricante } from '../../fabricantes/entities/fabricante.entity';
import { Vehiculo } from '../../vehiculos/entities/vehiculo.entity';
import { Tienda } from '../../tiendas/entities/tienda.entity';
import {
  MonedaEnum,
  TamanoRepuestoEnum,
  CondicionRepuestoEnum,
} from '../../common/enums';

@Entity('repuestos')
export class Repuesto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  sku: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  numero_oem: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'text' })
  url_imagen: string;

  @Column({
    type: 'enum',
    enum: MonedaEnum,
    default: MonedaEnum.BOB,
  })
  moneda_base: MonedaEnum;

  @Column({ type: 'float' })
  precio_base: number;

  @Column({ type: 'float' })
  precio_bob: number;

  @Column({ type: 'float' })
  precio_usd: number;

  @Column({ type: 'int', default: 10 })
  stock_disponible: number;

  @Column({ type: 'int', default: 2 })
  stock_minimo: number;

  @Column({ type: 'int', default: 0 })
  stock_reservado: number;

  @Column({ type: 'boolean', default: true })
  esta_activo: boolean;

  @Column({ type: 'float', default: 1.0 })
  peso_kg: number;

  @Column({
    type: 'enum',
    enum: TamanoRepuestoEnum,
    default: TamanoRepuestoEnum.PEQUENO,
  })
  tamano: TamanoRepuestoEnum;

  @Column({
    type: 'enum',
    enum: CondicionRepuestoEnum,
    default: CondicionRepuestoEnum.NUEVO_ORIGINAL_OEM,
  })
  condicion: CondicionRepuestoEnum;

  @Column({ type: 'int', default: 6 })
  meses_garantia: number;

  @Column({ type: 'float', default: 2.0 })
  tiempo_entrega_horas: number;

  @Column({ type: 'boolean', default: false })
  es_destacado: boolean;

  @Column({ type: 'int', default: 0 })
  nivel_prioridad: number;

  @Column({ type: 'timestamptz', nullable: true })
  destacado_hasta: Date | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  resenas: Array<{
    id?: string;
    autor_nombre: string;
    calificacion: number;
    comentario: string;
    vehiculo_instalado: string;
    fecha: string;
  }>;

  @ManyToOne(() => Categoria, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @Column({ name: 'categoria_id' })
  categoria_id: number;

  @ManyToOne(() => Fabricante, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'fabricante_id' })
  fabricante: Fabricante;

  @Column({ name: 'fabricante_id' })
  fabricante_id: number;

  @ManyToOne(() => Vehiculo, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  @Column({ name: 'vehiculo_id' })
  vehiculo_id: number;

  @ManyToOne(() => Tienda, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'tienda_id' })
  tienda: Tienda;

  @Column({ name: 'tienda_id' })
  tienda_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;
}

