import { Repuesto } from './repuesto.model';
import { Tienda } from './tienda.model';
import { Usuario } from './usuario.model';
import { Repartidor } from './repartidor.model';

export interface Pedido {
  id: string;
  numero_orden: string;
  moneda_pago: 'BOB' | 'USD';
  metodo_pago: 'QR_SIMPLE' | 'TARJETA_DEBITO_CREDITO';
  cantidad?: number;
  subtotal_repuesto_bs: number;
  tarifa_envio_bs: number;
  tarifa_servicio_app_bs: number;
  total_bs: number;
  total_usd: number;
  tasa_cambio_congelada: number;
  comision_tuauto_bs: number;
  liquidacion_tienda_bs: number;
  estado:
    | 'PENDIENTE_PAGO'
    | 'PAGADO_ESCROW'
    | 'EN_PREPARACION'
    | 'EN_CAMINO_A_TIENDA'
    | 'EN_TIENDA'
    | 'EN_CAMINO'
    | 'EN_CAMINO_A_DESTINO'
    | 'EN_DESTINO'
    | 'LISTO_RETIRO'
    | 'ENTREGADO'
    | 'COMPLETADO'
    | 'DISPUTA'
    | 'REEMBOLSADO';
  tipo_entrega: 'DELIVERY_MOTO' | 'RETIRO_TIENDA';
  latitud_entrega?: number | null;
  longitud_entrega?: number | null;
  direccion_escrita?: string;
  referencia?: string;
  pin_entrega: string;
  codigo_qr_payload: string;
  codigo_autorizacion_banco?: string | null;
  motivo_disputa?: string | null;
  usuario_comprador_id: string;
  usuario_comprador?: Usuario;
  tienda_id: string;
  tienda?: Tienda;
  repuesto_id: string;
  repuesto?: Repuesto;
  repartidor_id?: string | null;
  repartidor?: Repartidor | null;
  distancia_repartidor_tienda_km?: number;
  creado_en?: string;
  actualizado_en?: string;
}
