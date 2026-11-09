import { TamanoRepuestoEnum } from '../../common/enums';

export interface CotizacionLogistica {
  tarifa_envio_bs: number;
  distancia_km: number;
  costo_base_bs: number;
  costo_km_bs: number;
  costo_peso_bs: number;
  costo_tamano_bs: number;
  codigo_vehiculo: string;
  nombre_vehiculo: string;
  detalles: string;
}

export interface ParametrosCalculoEnvio {
  distanciaKm: number;
  pesoKg: number;
  tamano: TamanoRepuestoEnum;
  tarifaBase?: number;
  kmBase?: number;
  precioKmExtra?: number;
  pesoBase?: number;
  recargoKgExtra?: number;
  recargoMediano?: number;
  recargoGrande?: number;
}

/**
 * Interfaz base para el Patrón Strategy de Despacho y Logística Automotriz
 */
export interface ILogisticaStrategy {
  readonly codigo: string;
  readonly nombre: string;
  readonly pesoMaximoKg: number;
  readonly tamanoMaximo: TamanoRepuestoEnum;

  /**
   * Determina si este vehículo es técnicamente apto para transportar el repuesto
   */
  puedeTransportar(pesoKg: number, tamano: TamanoRepuestoEnum): boolean;

  /**
   * Ejecuta el cálculo exacto de la tarifa según el perfil del transporte
   */
  calcularTarifa(params: ParametrosCalculoEnvio): CotizacionLogistica;
}

