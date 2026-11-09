import { Injectable, Logger } from '@nestjs/common';
import { ILogisticaStrategy, ParametrosCalculoEnvio, CotizacionLogistica } from './ilogistica.strategy';
import { MotoLogisticaStrategy } from './moto-logistica.strategy';
import { ToritoLogisticaStrategy } from './torito-logistica.strategy';
import { AutoLogisticaStrategy } from './auto-logistica.strategy';
import { CamionetaLogisticaStrategy } from './camioneta-logistica.strategy';
import { RetiroTiendaStrategy } from './retiro-tienda.strategy';
import { TamanoRepuestoEnum } from '../../common/enums';

@Injectable()
export class LogisticaContext {
  private readonly logger = new Logger(LogisticaContext.name);
  private readonly estrategias = new Map<string, ILogisticaStrategy>();
  private readonly ordenEstrategiasDelivery: ILogisticaStrategy[];

  constructor(
    private readonly motoStrategy: MotoLogisticaStrategy,
    private readonly toritoStrategy: ToritoLogisticaStrategy,
    private readonly autoStrategy: AutoLogisticaStrategy,
    private readonly camionetaStrategy: CamionetaLogisticaStrategy,
    private readonly retiroStrategy: RetiroTiendaStrategy,
  ) {
    this.registrarEstrategia(this.motoStrategy);
    this.registrarEstrategia(this.toritoStrategy);
    this.registrarEstrategia(this.autoStrategy);
    this.registrarEstrategia(this.camionetaStrategy);
    this.registrarEstrategia(this.retiroStrategy);

    // Orden de preferencia económica: Moto -> Torito -> Auto -> Camioneta
    this.ordenEstrategiasDelivery = [
      this.motoStrategy,
      this.toritoStrategy,
      this.autoStrategy,
      this.camionetaStrategy,
    ];
  }

  registrarEstrategia(estrategia: ILogisticaStrategy): void {
    this.estrategias.set(estrategia.codigo.toUpperCase(), estrategia);
  }

  obtenerEstrategia(codigoVehiculo: string): ILogisticaStrategy {
    const key = (codigoVehiculo || '').toUpperCase().trim();
    const strategy = this.estrategias.get(key);
    if (!strategy) {
      this.logger.warn(`Estrategia para '${codigoVehiculo}' no encontrada. Aplicando Moto por defecto.`);
      return this.motoStrategy;
    }
    return strategy;
  }

  /**
   * Resuelve automáticamente el transporte óptimo y más económico
   * capaz de trasladar el peso y volumen del repuesto.
   */
  seleccionarEstrategiaOptima(pesoKg: number, tamano: TamanoRepuestoEnum): ILogisticaStrategy {
    for (const strategy of this.ordenEstrategiasDelivery) {
      if (strategy.puedeTransportar(pesoKg, tamano)) {
        return strategy;
      }
    }
    // Si excede todo, asignar Camioneta Cargo
    return this.camionetaStrategy;
  }

  /**
   * Ejecuta el cálculo usando la estrategia solicitada o la óptima
   */
  calcularCotizacion(
    codigoVehiculo: string | null | undefined,
    params: ParametrosCalculoEnvio,
  ): CotizacionLogistica {
    const strategy = codigoVehiculo
      ? this.obtenerEstrategia(codigoVehiculo)
      : this.seleccionarEstrategiaOptima(params.pesoKg, params.tamano);

    return strategy.calcularTarifa(params);
  }
}

