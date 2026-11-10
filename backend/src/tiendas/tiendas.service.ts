import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tienda } from './entities/tienda.entity';
import { CrearTiendaDto } from './dto/crear-tienda.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { PlanTiendaEnum, RolEnum, TipoEstablecimientoEnum } from '../common/enums';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class TiendasService {
  constructor(
    @InjectRepository(Tienda)
    private readonly tiendaRepository: Repository<Tienda>,
    private readonly usuariosService: UsuariosService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async findAll(): Promise<Tienda[]> {
    return this.tiendaRepository.find({
      relations: { usuario: true },
      order: { creado_en: 'DESC', calificacion: 'DESC' },
    });
  }

  async findById(id: string): Promise<Tienda> {
    const tienda = await this.tiendaRepository.findOne({
      where: { id },
      relations: { usuario: true },
    });
    if (!tienda) {
      throw new NotFoundException(`Tienda con ID ${id} no encontrada`);
    }
    return tienda;
  }

  async findByUsuarioId(usuarioId: string): Promise<Tienda[]> {
    return this.tiendaRepository.find({
      where: { usuario_id: usuarioId },
      relations: { usuario: true },
    });
  }

  async create(dto: CrearTiendaDto): Promise<Tienda> {
    await this.usuariosService.findById(dto.usuario_id);
    const nueva = this.tiendaRepository.create(dto);
    return this.tiendaRepository.save(nueva);
  }

  async registrarSolicitudTienda(body: {
    correo: string;
    clave: string;
    nombre_completo: string;
    telefono: string;
    nombre_tienda: string;
    nit: string;
    direccion_escrita: string;
    referencia?: string;
    horario_atencion?: string;
    especialidad?: string;
    servicios_taller?: string;
    tipo_establecimiento?: TipoEstablecimientoEnum;
    plan_suscripcion?: PlanTiendaEnum;
    latitud?: number;
    longitud?: number;
  }): Promise<Tienda> {
    const usuario = await this.usuariosService.registrar({
      correo: body.correo,
      clave: body.clave,
      nombre_completo: body.nombre_completo,
      telefono: body.telefono,
      ciudad_zona: body.direccion_escrita,
      estado_cuenta: 'PENDIENTE_APROBACION',
      rol: RolEnum.VENDEDOR,
    });

    const nuevaTienda = this.tiendaRepository.create({
      tipo_establecimiento: body.tipo_establecimiento || TipoEstablecimientoEnum.TIENDA_REPUESTOS,
      nombre: body.nombre_tienda,
      nit: body.nit || 'S/N',
      direccion_escrita: body.direccion_escrita,
      referencia: body.referencia || 'Santa Cruz de la Sierra',
      telefono: body.telefono,
      horario_atencion: body.horario_atencion || 'Lun a Sáb: 08:00 - 19:00',
      especialidad: body.especialidad || 'Repuestos Automotrices Generales',
      servicios_taller: body.servicios_taller || null,
      latitud: body.latitud ?? -17.7833,
      longitud: body.longitud ?? -63.1821,
      calificacion: 0.0,
      total_resenas: 0,
      esta_verificada: false,
      plan_suscripcion: body.plan_suscripcion || PlanTiendaEnum.GRATUITO,
      usuario_id: usuario.id,
    });

    const guardada = await this.tiendaRepository.save(nuevaTienda);
    const completa = await this.findById(guardada.id);
    this.realtimeGateway.emitirSolicitudAfiliacion({
      tipo: 'TIENDA',
      id: completa.id,
      nombre: completa.nombre,
      detalle: `NIT: ${completa.nit} • ${completa.direccion_escrita}`,
      creado_en: completa.creado_en,
    });
    return completa;
  }

  async aprobarTienda(id: string): Promise<Tienda> {
    const tienda = await this.findById(id);
    tienda.esta_verificada = true;
    await this.usuariosService.cambiarEstadoCuenta(tienda.usuario_id, 'ACTIVO');
    const guardada = await this.tiendaRepository.save(tienda);
    this.realtimeGateway.emitirSolicitudActualizada({
      tipo: 'TIENDA',
      id: guardada.id,
      estado: 'APROBADA',
    });
    return guardada;
  }

  async rechazarTienda(id: string): Promise<Tienda> {
    const tienda = await this.findById(id);
    tienda.esta_verificada = false;
    await this.usuariosService.cambiarEstadoCuenta(tienda.usuario_id, 'RECHAZADO');
    const guardada = await this.tiendaRepository.save(tienda);
    this.realtimeGateway.emitirSolicitudActualizada({
      tipo: 'TIENDA',
      id: guardada.id,
      estado: 'RECHAZADA',
    });
    return guardada;
  }

  async actualizarPlan(id: string, nuevoPlan: PlanTiendaEnum): Promise<Tienda> {
    const tienda = await this.findById(id);
    tienda.plan_suscripcion = nuevoPlan;
    return this.tiendaRepository.save(tienda);
  }
}
