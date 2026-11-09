import { Injectable } from '@nestjs/common';
import { ILogisticaStrategy, ParametrosCalculoEnvio, CotizacionLogistica } from './ilogistica.strategy';
import { TamanoRepuestoEnum } from '../../common/enums';

@Injectable()
export class CamionetaLogisticaStrategy implements ILogisticaStrategy {
  readonly codigo = 'CAMIONETA';
  readonly nombre = 'Camioneta Utilitaria de Carga';
  readonly pesoMaximoKg = 250.0;
  readonly tamanoMaximo = TamanoRepuestoEnum.GRANDE;

  puedeTransportar(pesoKg: number, _tamano: TamanoRepuestoEnum): boolean {
    return pesoKg <= this.pesoMaximoKg;
  }

  calcularTarifa(params: ParametrosCalculoEnvio): CotizacionLogistica {
    const tarifaBase = params.tarifaBase ? params.tarifaBase * 3.5 : 35.0;
    const kmBase = params.kmBase ?? 3.0;
    const precioKmExtra = params.precioKmExtra ? params.precioKmExtra * 2.0 : 4.0;
    const pesoBase = params.pesoBase ?? 20.0;
    const recargoKgExtra = params.recargoKgExtra ?? 1.5;
    const recargoGrande = params.recargoGrande ?? 8.0;

    let costoKm = 0;
    if (params.distanciaKm > kmBase) {
      costoKm = (params.distanciaKm - kmBase) * precioKmExtra;
    }

    let costoPeso = 0;
    if (params.pesoKg > pesoBase) {
      costoPeso = (params.pesoKg - pesoBase) * recargoKgExtra;
    }

    const costoTamano = params.tamano === TamanoRepuestoEnum.GRANDE ? recargoGrande : 0;
    const total = Math.round((tarifaBase + costoKm + costoPeso + costoTamano) * 100) / 100;

    return {
      tarifa_envio_bs: total,
      distancia_km: params.distanciaKm,
      costo_base_bs: tarifaBase,
      costo_km_bs: Math.round(costoKm * 100) / 100,
      costo_peso_bs: Math.round(costoPeso * 100) / 100,
      costo_tamano_bs: costoTamano,
      codigo_vehiculo: this.codigo,
      nombre_vehiculo: this.nombre,
      detalles: `Camioneta Cargo: Base Bs ${tarifaBase} + Distancia Bs ${costoKm.toFixed(2)} + Flete Pesado Bs ${costoPeso.toFixed(2)} + Volumen Bs ${costoTamano}`,
    };
  }
}

