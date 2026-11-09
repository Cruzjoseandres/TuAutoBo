import { Categoria } from './categoria.model';
import { Fabricante } from './fabricante.model';
import { Vehiculo } from './vehiculo.model';
import { Tienda } from './tienda.model';

export interface ResenaRepuesto {
  id: string;
  repuesto_id: string;
  autor_nombre: string;
  vehiculo_instalado: string;
  calificacion: number;
  comentario: string;
  compra_verificada: boolean;
  creado_en: string;
}

export interface RespuestaPaginadaRepuestos {
  datos: Repuesto[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

export interface Repuesto {
  id: string;
  titulo: string;
  sku: string;
  numero_oem?: string;
  descripcion: string;
  url_imagen: string;
  moneda_base: 'BOB' | 'USD';
  precio_base: number;
  precio_bob: number;
  precio_usd: number;
  stock_disponible: number;
  stock_reservado: number;
  stock_minimo?: number;
  esta_activo?: boolean;
  peso_kg: number;
  tamano: 'PEQUENO' | 'MEDIANO' | 'GRANDE';
  condicion: 'NUEVO_ORIGINAL_OEM' | 'NUEVO_ALTERNATIVO' | 'REACONDICIONADO';
  meses_garantia?: number;
  tiempo_entrega_horas?: number;
  es_destacado: boolean;
  nivel_prioridad: number;
  destacado_hasta?: string | null;
  categoria_id: number;
  categoria?: Categoria;
  fabricante_id: number;
  fabricante?: Fabricante;
  vehiculo_id: number;
  vehiculo?: Vehiculo;
  tienda_id: string;
  tienda?: Tienda;
  creado_en?: string;
  actualizado_en?: string;
}
