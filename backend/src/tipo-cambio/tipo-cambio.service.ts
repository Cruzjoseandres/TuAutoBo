import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoCambio } from './entities/tipo-cambio.entity';
import { ActualizarTipoCambioDto } from './dto/actualizar-tipo-cambio.dto';
import { MonedaEnum } from '../common/enums';
import { ParametrosService } from '../parametros/parametros.service';

@Injectable()
export class TipoCambioService implements OnModuleInit {
  private readonly logger = new Logger(TipoCambioService.name);

  constructor(
    @InjectRepository(TipoCambio)
    private readonly tipoCambioRepository: Repository<TipoCambio>,
    private readonly parametrosService: ParametrosService,
  ) {}

  async onModuleInit() {
    this.logger.log('Sincronizando cotización oficial del Banco Central de Bolivia (cucu.bo)...');
    try {
      await this.sincronizarConApiExterna();
    } catch (err) {
      this.logger.warn(`No se pudo sincronizar automáticamente al iniciar: ${err.message}`);
    }
  }

  async obtenerTasaActual(
    origen: MonedaEnum = MonedaEnum.USD,
    destino: MonedaEnum = MonedaEnum.BOB,
  ): Promise<number> {
    if (origen === destino) return 1.0;

    const registro = await this.tipoCambioRepository.findOne({
      where: { moneda_origen: MonedaEnum.USD, moneda_destino: MonedaEnum.BOB },
    });

    let tasaUsdBob = registro?.tasa_cambio ? Number(registro.tasa_cambio) : null;
    if (!tasaUsdBob || isNaN(tasaUsdBob) || tasaUsdBob <= 0) {
      tasaUsdBob = await this.parametrosService.obtenerNumero('TASA_CAMBIO_DOLAR_DEFECTO', 6.96);
    }

    if (origen === MonedaEnum.USD && destino === MonedaEnum.BOB) {
      return tasaUsdBob;
    } else if (origen === MonedaEnum.BOB && destino === MonedaEnum.USD) {
      return 1 / tasaUsdBob;
    }

    return 1.0;
  }

  async convertir(
    monto: number,
    de: MonedaEnum,
    a: MonedaEnum,
  ): Promise<{ monto_original: number; monto_convertido: number; tasa: number }> {
    const tasa = await this.obtenerTasaActual(de, a);
    const monto_convertido = Math.round(monto * tasa * 100) / 100;
    return {
      monto_original: monto,
      monto_convertido,
      tasa: Math.round(tasa * 10000) / 10000,
    };
  }

  async obtenerRegistro(): Promise<TipoCambio> {
    let registro = await this.tipoCambioRepository.findOne({
      where: { moneda_origen: MonedaEnum.USD, moneda_destino: MonedaEnum.BOB },
    });
    if (!registro) {
      const tasaRespaldo = await this.parametrosService.obtenerNumero('TASA_CAMBIO_DOLAR_DEFECTO', 6.96);
      registro = await this.tipoCambioRepository.save({
        moneda_origen: MonedaEnum.USD,
        moneda_destino: MonedaEnum.BOB,
        tasa_cambio: tasaRespaldo,
        fuente: 'Parámetro del Sistema',
      });
    }
    return registro;
  }

  async actualizarTasa(dto: ActualizarTipoCambioDto): Promise<TipoCambio> {
    const registro = await this.obtenerRegistro();
    registro.tasa_cambio = dto.tasa_cambio;
    if (dto.fuente) registro.fuente = dto.fuente;
    const guardado = await this.tipoCambioRepository.save(registro);

    // Persistir de forma atómica en la tabla parametros (TASA_CAMBIO_DOLAR_DEFECTO)
    // para que el último tipo de cambio sincronizado/fijado sea el parámetro de respaldo del negocio
    try {
      await this.parametrosService.actualizar('TASA_CAMBIO_DOLAR_DEFECTO', {
        valor: String(guardado.tasa_cambio),
      });
      this.logger.log(`TASA_CAMBIO_DOLAR_DEFECTO sincronizado exitosamente con tasa: ${guardado.tasa_cambio}`);
    } catch (err) {
      this.logger.warn(`No se pudo actualizar TASA_CAMBIO_DOLAR_DEFECTO: ${err.message}`);
    }

    return guardado;
  }

  async sincronizarConApiExterna(): Promise<TipoCambio> {
    // 1. Prioridad: API Oficial del BCB provista por CUCU (apibcb.cucu.bo)
    try {
      const response = await fetch('https://apibcb.cucu.bo/api/v1/tc/oficial', {
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        const tasaOficial = Number(data?.tc_oficial?.valor || data?.tc_oficial?.compra);
        if (tasaOficial && !isNaN(tasaOficial) && tasaOficial > 0) {
          const fecha = data?.tc_oficial?.fecha || 'Vigente';
          this.logger.log(`Tipo de cambio oficial BCB (cucu.bo) obtenido: ${tasaOficial} BOB/USD (${fecha})`);
          return this.actualizarTasa({
            tasa_cambio: tasaOficial,
            fuente: `Banco Central de Bolivia (BCB via cucu.bo - ${fecha})`,
          });
        }
      }
    } catch (err) {
      this.logger.warn(`No se pudo conectar a apibcb.cucu.bo: ${err.message}. Intentando respaldo...`);
    }

    // 2. Respaldo secundario internacional si cucu.bo está temporalmente inaccesible
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (response.ok) {
        const data = await response.json();
        const tasaBob = data?.rates?.BOB;
        if (tasaBob && typeof tasaBob === 'number') {
          return this.actualizarTasa({
            tasa_cambio: tasaBob,
            fuente: 'Open Exchange Rates (Respaldo)',
          });
        }
      }
    } catch (err) {
      this.logger.warn('No se pudo conectar al respaldo de tipo de cambio:', err.message);
    }

    return this.obtenerRegistro();
  }
}
