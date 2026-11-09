import { Usuario } from './usuario.model';
import { TipoVehiculo } from './tipo-vehiculo.model';
import { TipoVehiculoEnum, TamanoRepuestoEnum } from './enums';

export interface Repartidor {
  id: string;
  usuario_id: string;
  usuario?: Usuario;
  tipo_vehiculo_id?: number;
  tipo_vehiculo_rel?: TipoVehiculo;
  tipo_vehiculo: TipoVehiculoEnum | string;
  placa: string;
  licencia_conducir?: string;
  capacidad_peso_min_kg: number;
  capacidad_peso_max_kg: number;
  tamano_maximo: TamanoRepuestoEnum | string;
  latitud_actual: number;
  longitud_actual: number;
  esta_activo: boolean;
  esta_verificado: boolean;
  creado_en?: string;
  actualizado_en?: string;
}
