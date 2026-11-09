import { Rol } from './rol.model';

export interface Usuario {
  id: string;
  correo: string;
  nombre_completo: string;
  telefono: string;
  ciudad_zona?: string;
  estado_cuenta?: string;
  roles: string[] | Rol[];
  token?: string;
  creado_en?: string;
}

export interface RespuestaAuth {
  id: string;
  correo: string;
  nombre_completo: string;
  telefono: string;
  ciudad_zona?: string;
  estado_cuenta?: string;
  roles: string[];
  token: string;
}
