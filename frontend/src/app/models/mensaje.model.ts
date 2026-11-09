import { Usuario } from './usuario.model';
import { Tienda } from './tienda.model';
import { Repuesto } from './repuesto.model';

export interface Mensaje {
  id: string;
  texto: string;
  url_imagen?: string | null;
  es_confirmacion_compatibilidad: boolean;
  remitente_tipo: 'COMPRADOR' | 'TIENDA' | 'SISTEMA';
  remitente_nombre: string;
  usuario_id: string;
  usuario?: Usuario;
  tienda_id: string;
  tienda?: Tienda;
  repuesto_id?: string | null;
  repuesto?: Repuesto | null;
  creado_en?: string;
}
