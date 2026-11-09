import { Injectable } from '@nestjs/common';
import { ILogisticaStrategy, ParametrosCalculoEnvio, CotizacionLogistica } from './ilogistica.strategy';
import { TamanoRepuestoEnum } from '../../common/enums';

@Injectable()
export class RetiroTiendaStrategy implements ILogisticaStrategy {
  readonly codigo = 'RETIRO_TIENDA';
  readonly nombre = 'Retiro Presencial en Tienda o Taller';
  readonly pesoMaximoKg = 9999.0;
  readonly tamanoMaximo = TamanoRepuestoEnum.GRANDE;

  puedeTransportar(_pesoKg: number, _tamano: TamanoRepuestoEnum): boolean {
    return true;
  }

  calcularTarifa(params: ParametrosCalculoEnvio): CotizacionLogistica {
    return {
      tarifa_envio_bs: 0.0,
      distancia_km: 0.0,
      costo_base_bs: 0.0,
      costo_km_bs: 0.0,
      costo_peso_bs: 0.0,
      costo_tamano_bs: 0.0,
      codigo_vehiculo: this.codigo,
      nombre_vehiculo: this.nombre,
      detalles: 'Retiro directo y gratuito en la sede física de la tienda o taller aliado.',
    };
  }
}

