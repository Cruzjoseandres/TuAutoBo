import { Injectable } from '@nestjs/common';
import { ILogisticaStrategy, ParametrosCalculoEnvio, CotizacionLogistica } from './ilogistica.strategy';
import { TamanoRepuestoEnum } from '../../common/enums';

@Injectable()
export class ToritoLogisticaStrategy implements ILogisticaStrategy {
  readonly codigo = 'TORITO_MOTOCARRO';
  readonly nombre = 'Torito / Motocarro';
  readonly pesoMaximoKg = 60.0;
  readonly tamanoMaximo = TamanoRepuestoEnum.MEDIANO;

  puedeTransportar(pesoKg: number, tamano: TamanoRepuestoEnum): boolean {
    return pesoKg <= this.pesoMaximoKg && (tamano === TamanoRepuestoEnum.PEQUENO || tamano === TamanoRepuestoEnum.MEDIANO);
  }

  calcularTarifa(params: ParametrosCalculoEnvio): CotizacionLogistica {
    const tarifaBase = params.tarifaBase ? params.tarifaBase * 1.5 : 15.0;
    const kmBase = params.kmBase ?? 3.0;
    const precioKmExtra = params.precioKmExtra ? params.precioKmExtra * 1.25 : 2.5;
    const pesoBase = params.pesoBase ?? 8.0;
    const recargoKgExtra = params.recargoKgExtra ?? 1.5;
    const recargoMediano = params.recargoMediano ?? 3.0;

    let costoKm = 0;
    if (params.distanciaKm > kmBase) {
      costoKm = (params.distanciaKm - kmBase) * precioKmExtra;
    }

    let costoPeso = 0;
    if (params.pesoKg > pesoBase) {
      costoPeso = (params.pesoKg - pesoBase) * recargoKgExtra;
    }

    const costoTamano = params.tamano === TamanoRepuestoEnum.MEDIANO ? recargoMediano : 0;
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
      detalles: `Torito Utilitario: Base Bs ${tarifaBase} + Distancia Bs ${costoKm.toFixed(2)} + Peso Bs ${costoPeso.toFixed(2)} + Bulto Mediano Bs ${costoTamano}`,
    };
  }
}

