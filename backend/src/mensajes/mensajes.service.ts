import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensaje } from './entities/mensaje.entity';
import { CrearMensajeDto } from './dto/crear-mensaje.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { TiendasService } from '../tiendas/tiendas.service';
import { RepuestosService } from '../repuestos/repuestos.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class MensajesService {
  constructor(
    @InjectRepository(Mensaje)
    private readonly mensajeRepository: Repository<Mensaje>,
    private readonly usuariosService: UsuariosService,
    private readonly tiendasService: TiendasService,
    private readonly repuestosService: RepuestosService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async crearMensaje(dto: CrearMensajeDto): Promise<Mensaje> {
    await this.usuariosService.findById(dto.usuario_id);
    await this.tiendasService.findById(dto.tienda_id);

    if (dto.repuesto_id) {
      await this.repuestosService.findById(dto.repuesto_id);
    }

    const nuevo = this.mensajeRepository.create({
      texto: dto.texto,
      url_imagen: dto.url_imagen ?? null,
      es_confirmacion_compatibilidad: dto.es_confirmacion_compatibilidad ?? false,
      remitente_tipo: dto.remitente_tipo,
      remitente_nombre: dto.remitente_nombre,
      usuario_id: dto.usuario_id,
      tienda_id: dto.tienda_id,
      repuesto_id: dto.repuesto_id ?? null,
    });

    const guardado = await this.mensajeRepository.save(nuevo);

    const completo = await this.mensajeRepository
      .createQueryBuilder('mensaje')
      .leftJoinAndSelect('mensaje.usuario', 'usuario')
      .leftJoinAndSelect('mensaje.tienda', 'tienda')
      .leftJoinAndSelect('mensaje.repuesto', 'repuesto')
      .where('mensaje.id = :id', { id: guardado.id })
      .getOne();

    const resultado = completo || guardado;
    this.realtimeGateway.emitirNuevoMensaje(resultado);
    return resultado;
  }

  async obtenerHistorialChat(
    usuarioId: string,
    tiendaId: string,
    repuestoId?: string,
  ): Promise<Mensaje[]> {
    const qb = this.mensajeRepository
      .createQueryBuilder('mensaje')
      .leftJoinAndSelect('mensaje.usuario', 'usuario')
      .leftJoinAndSelect('mensaje.tienda', 'tienda')
      .leftJoinAndSelect('mensaje.repuesto', 'repuesto')
      .where('mensaje.usuario_id = :usuarioId AND mensaje.tienda_id = :tiendaId', {
        usuarioId,
        tiendaId,
      });

    if (repuestoId) {
      qb.andWhere('mensaje.repuesto_id = :repuestoId', {
        repuestoId,
      });
    }

    qb.orderBy('mensaje.creado_en', 'ASC');

    return qb.getMany();
  }

  async obtenerConversacionesTienda(tiendaId: string): Promise<Mensaje[]> {
    return this.mensajeRepository
      .createQueryBuilder('mensaje')
      .leftJoinAndSelect('mensaje.usuario', 'usuario')
      .leftJoinAndSelect('mensaje.tienda', 'tienda')
      .leftJoinAndSelect('mensaje.repuesto', 'repuesto')
      .where('mensaje.tienda_id = :tiendaId', { tiendaId })
      .orderBy('mensaje.creado_en', 'ASC')
      .getMany();
  }

  async obtenerConversacionesComprador(usuarioId: string): Promise<Mensaje[]> {
    return this.mensajeRepository
      .createQueryBuilder('mensaje')
      .leftJoinAndSelect('mensaje.usuario', 'usuario')
      .leftJoinAndSelect('mensaje.tienda', 'tienda')
      .leftJoinAndSelect('mensaje.repuesto', 'repuesto')
      .where('mensaje.usuario_id = :usuarioId', { usuarioId })
      .orderBy('mensaje.creado_en', 'ASC')
      .getMany();
  }
}

