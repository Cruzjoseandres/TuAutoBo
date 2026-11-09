export interface Rol {
  id: number;
  nombre: 'COMPRADOR' | 'VENDEDOR' | 'REPARTIDOR' | 'ADMINISTRADOR';
  descripcion?: string;
}
