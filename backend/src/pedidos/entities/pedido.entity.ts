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
import { Tienda } from '../../tiendas/entities/tienda.entity';
import { Repuesto } from '../../repuestos/entities/repuesto.entity';
import { Repartidor } from '../../repartidores/entities/repartidor.entity';
import {
  MonedaEnum,
  MetodoPagoEnum,
  EstadoPedidoEnum,
  TipoEntregaEnum,
} from '../../common/enums';

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  numero_orden: string;

  @Column({
    type: 'enum',
    enum: MonedaEnum,
    default: MonedaEnum.BOB,
  })
  moneda_pago: MonedaEnum;

  @Column({
    type: 'enum',
    enum: MetodoPagoEnum,
    default: MetodoPagoEnum.QR_SIMPLE,
  })
  metodo_pago: MetodoPagoEnum;

  @Column({ type: 'int', default: 1 })
  cantidad: number;

  @Column({ type: 'float' })
  subtotal_repuesto_bs: number;

  @Column({ type: 'float', default: 0.0 })
  tarifa_envio_bs: number;

  @Column({ type: 'float', default: 2.0 })
  tarifa_servicio_app_bs: number;

  @Column({ type: 'float' })
  total_bs: number;

  @Column({ type: 'float' })
  total_usd: number;

  @Column({ type: 'float', default: 6.96 })
  tasa_cambio_congelada: number;

  @Column({ type: 'float' })
  comision_tuauto_bs: number;

  @Column({ type: 'float' })
  liquidacion_tienda_bs: number;

  @Column({
    type: 'enum',
    enum: EstadoPedidoEnum,
    default: EstadoPedidoEnum.PENDIENTE_PAGO,
  })
  estado: EstadoPedidoEnum;

  @Column({
    type: 'enum',
    enum: TipoEntregaEnum,
    default: TipoEntregaEnum.DELIVERY_MOTO,
  })
  tipo_entrega: TipoEntregaEnum;

  @Column({ type: 'double precision', nullable: true })
  latitud_entrega: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitud_entrega: number | null;

  @Column({ type: 'text', nullable: true })
  direccion_escrita: string;

  @Column({ type: 'text', nullable: true })
  referencia: string;

  @Column({ type: 'varchar', length: 6 })
  pin_entrega: string;

  @Column({ type: 'text' })
  codigo_qr_payload: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  codigo_autorizacion_banco: string | null;

  @Column({ type: 'text', nullable: true })
  motivo_disputa: string | null;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'usuario_comprador_id' })
  usuario_comprador: Usuario;

  @Column({ name: 'usuario_comprador_id' })
  usuario_comprador_id: string;

  @ManyToOne(() => Tienda, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'tienda_id' })
  tienda: Tienda;

  @Column({ name: 'tienda_id' })
  tienda_id: string;

  @ManyToOne(() => Repuesto, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'repuesto_id' })
  repuesto: Repuesto;

  @Column({ name: 'repuesto_id' })
  repuesto_id: string;

  @ManyToOne(() => Repartidor, { onDelete: 'SET NULL', nullable: true, eager: true })
  @JoinColumn({ name: 'repartidor_id' })
  repartidor: Repartidor | null;

  @Column({ name: 'repartidor_id', nullable: true })
  repartidor_id: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;
}

