import { Injectable } from '@nestjs/common';
import { ILogisticaStrategy, ParametrosCalculoEnvio, CotizacionLogistica } from './ilogistica.strategy';
import { TamanoRepuestoEnum } from '../../common/enums';

@Injectable()
export class MotoLogisticaStrategy implements ILogisticaStrategy {
  readonly codigo = 'MOTOCICLETA';
  readonly nombre = 'Motocicleta Express';
  readonly pesoMaximoKg = 20.0;
  readonly tamanoMaximo = TamanoRepuestoEnum.PEQUENO;

  puedeTransportar(pesoKg: number, tamano: TamanoRepuestoEnum): boolean {
    return pesoKg <= this.pesoMaximoKg && tamano === TamanoRepuestoEnum.PEQUENO;
  }

  calcularTarifa(params: ParametrosCalculoEnvio): CotizacionLogistica {
    const tarifaBase = params.tarifaBase ?? 10.0;
    const kmBase = params.kmBase ?? 3.0;
    const precioKmExtra = params.precioKmExtra ?? 2.0;
    const pesoBase = params.pesoBase ?? 5.0;
    const recargoKgExtra = params.recargoKgExtra ?? 1.5;

    let costoKm = 0;
    if (params.distanciaKm > kmBase) {
      costoKm = (params.distanciaKm - kmBase) * precioKmExtra;
    }

    let costoPeso = 0;
    if (params.pesoKg > pesoBase) {
      costoPeso = (params.pesoKg - pesoBase) * recargoKgExtra;
    }

    const total = Math.round((tarifaBase + costoKm + costoPeso) * 100) / 100;

    return {
      tarifa_envio_bs: total,
      distancia_km: params.distanciaKm,
      costo_base_bs: tarifaBase,
      costo_km_bs: Math.round(costoKm * 100) / 100,
      costo_peso_bs: Math.round(costoPeso * 100) / 100,
      costo_tamano_bs: 0,
      codigo_vehiculo: this.codigo,
      nombre_vehiculo: this.nombre,
      detalles: `Moto Express: Base Bs ${tarifaBase} + Distancia (${params.distanciaKm.toFixed(1)} km) Bs ${costoKm.toFixed(2)} + Peso (${params.pesoKg.toFixed(1)} kg) Bs ${costoPeso.toFixed(2)}`,
    };
  }
}

