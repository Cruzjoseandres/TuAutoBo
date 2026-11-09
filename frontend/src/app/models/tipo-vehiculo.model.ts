import { TamanoRepuestoEnum } from './enums';

export interface TipoVehiculo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  peso_min_kg: number;
  peso_max_kg: number;
  tamano_maximo: TamanoRepuestoEnum;
  tarifa_base_bs: number;
  precio_km_adicional_bs: number;
  icono_svg: string;
  orden_visual: number;
  esta_activo: boolean;
}

