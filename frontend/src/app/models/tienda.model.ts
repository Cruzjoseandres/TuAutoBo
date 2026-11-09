import { Usuario } from './usuario.model';

export type TipoEstablecimiento = 'TIENDA_REPUESTOS' | 'TALLER_MECANICO' | 'REPUESTERA_Y_TALLER';

export interface ServicioTaller {
  id: string;
  nombre: string;
  descripcion: string;
  precio_bob: number;
  tiempo_estimado_min: number;
  garantia_meses: number;
  categoria_repuesto_relacionada?: string;
}

export interface Tienda {
  id: string;
  nombre: string;
  tipo_establecimiento?: TipoEstablecimiento;
  tipo_negocio?: TipoEstablecimiento;
  latitud: number;
  longitud: number;
  direccion_escrita: string;
  referencia?: string;
  telefono: string;
  nit?: string;
  horario_atencion?: string;
  tiempo_preparacion_min?: number;
  especialidad?: string;
  servicios_taller?: ServicioTaller[] | string;
  calificacion: number;
  total_resenas?: number;
  esta_verificada: boolean;
  plan_suscripcion: 'GRATUITO' | 'PRO' | 'PREMIUM';
  usuario_id: string;
  usuario?: Usuario;
  creado_en?: string;
  actualizado_en?: string;
}
