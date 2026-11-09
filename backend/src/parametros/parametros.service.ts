import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parametro } from './entities/parametro.entity';
import { ActualizarParametroDto, CrearParametroDto } from './dto/actualizar-parametro.dto';

@Injectable()
export class ParametrosService {
  constructor(
    @InjectRepository(Parametro)
    private readonly parametroRepository: Repository<Parametro>,
  ) {}

  async findAll(): Promise<Parametro[]> {
    return this.parametroRepository.find({ order: { clave: 'ASC' } });
  }

  async findByClave(clave: string): Promise<Parametro> {
    const param = await this.parametroRepository.findOne({ where: { clave } });
    if (!param) {
      throw new NotFoundException(`Parámetro con clave '${clave}' no encontrado`);
    }
    return param;
  }

  async obtener(clave: string, valorPorDefecto: string = ''): Promise<string> {
    const param = await this.parametroRepository.findOne({ where: { clave } });
    return param ? param.valor : valorPorDefecto;
  }

  async obtenerNumero(clave: string, valorPorDefecto: number = 0): Promise<number> {
    const param = await this.parametroRepository.findOne({ where: { clave } });
    if (!param) return valorPorDefecto;
    const num = parseFloat(param.valor);
    return isNaN(num) ? valorPorDefecto : num;
  }

  async actualizar(clave: string, dto: ActualizarParametroDto): Promise<Parametro> {
    const param = await this.findByClave(clave);
    param.valor = dto.valor;
    return this.parametroRepository.save(param);
  }

  async create(dto: CrearParametroDto): Promise<Parametro> {
    const nuevo = this.parametroRepository.create(dto);
    return this.parametroRepository.save(nuevo);
  }
}
