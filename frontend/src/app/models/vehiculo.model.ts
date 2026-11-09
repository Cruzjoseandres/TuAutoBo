import { Modelo } from './modelo.model';

export interface Vehiculo {
  id: number;
  anio: number;
  motor: string;
  cilindrada: string;
  tipo_combustible: 'GASOLINA' | 'DIESEL' | 'HIBRIDO' | 'ELECTRICO' | 'GNC';
  transmision: 'MANUAL' | 'AUTOMATICA';
  modelo_id: number;
  modelo?: Modelo;
  creado_en?: string;
  actualizado_en?: string;
}
