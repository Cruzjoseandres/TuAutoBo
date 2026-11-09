import { Marca } from './marca.model';

export interface Modelo {
  id: number;
  nombre: string;
  marca_id: number;
  marca?: Marca;
  creado_en?: string;
  actualizado_en?: string;
}
