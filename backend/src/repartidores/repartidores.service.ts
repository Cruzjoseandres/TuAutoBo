import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Repartidor } from './entities/repartidor.entity';
import { CrearRepartidorDto } from './dto/crear-repartidor.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { TiposVehiculoService } from '../tipos-vehiculo/tipos-vehiculo.service';
import { TipoVehiculo } from '../tipos-vehiculo/entities/tipo-vehiculo.entity';
import { TipoVehiculoEnum, TamanoRepuestoEnum, RolEnum } from '../common/enums';

@Injectable()
export class RepartidoresService {
  constructor(
    @InjectRepository(Repartidor)
    private readonly repartidorRepository: Repository<Repartidor>,
    private readonly usuariosService: UsuariosService,
    private readonly tiposVehiculoService: TiposVehiculoService,
  ) {}

  async findAll(): Promise<Repartidor[]> {
    return this.repartidorRepository.find({
      relations: { usuario: true, tipo_vehiculo_rel: true },
      order: { creado_en: 'DESC' },
    });
  }

  async findById(id: string): Promise<Repartidor> {
    const rep = await this.repartidorRepository.findOne({
      where: { id },
      relations: { usuario: true, tipo_vehiculo_rel: true },
    });
    if (!rep) {
      throw new NotFoundException(`Repartidor con ID ${id} no encontrado`);
    }
    return rep;
  }

  async findByUsuarioId(usuarioId: string): Promise<Repartidor> {
    const rep = await this.repartidorRepository.findOne({
      where: { usuario_id: usuarioId },
      relations: { usuario: true, tipo_vehiculo_rel: true },
    });
    if (!rep) {
      throw new NotFoundException(`Repartidor para el usuario ${usuarioId} no encontrado`);
    }
    return rep;
  }

  async create(dto: CrearRepartidorDto): Promise<Repartidor> {
    await this.usuariosService.findById(dto.usuario_id);
    const nuevo = this.repartidorRepository.create(dto);
    return this.repartidorRepository.save(nuevo);
  }

  async registrarSolicitudRepartidor(body: {
    correo: string;
    clave: string;
    nombre_completo: string;
    telefono: string;
    ciudad_zona?: string;
    tipo_vehiculo?: TipoVehiculoEnum;
    tipo_vehiculo_id?: number;
    placa: string;
    licencia_conducir: string;
    capacidad_peso_min_kg?: number;
    capacidad_peso_max_kg?: number;
    tamano_maximo?: TamanoRepuestoEnum;
    latitud?: number;
    longitud?: number;
  }): Promise<Repartidor> {
    const usuario = await this.usuariosService.registrar({
      correo: body.correo,
      clave: body.clave,
      nombre_completo: body.nombre_completo,
      telefono: body.telefono,
      ciudad_zona: body.ciudad_zona || 'Santa Cruz de la Sierra',
      estado_cuenta: 'PENDIENTE_APROBACION',
      rol: RolEnum.REPARTIDOR,
    });

    let tipoVehiculoRel: TipoVehiculo | null = null;
    if (body.tipo_vehiculo_id) {
      try {
        tipoVehiculoRel = await this.tiposVehiculoService.findById(body.tipo_vehiculo_id);
      } catch {}
    }
    if (!tipoVehiculoRel && body.tipo_vehiculo) {
      tipoVehiculoRel = await this.tiposVehiculoService.findByCodigo(body.tipo_vehiculo);
    }

    const nuevoRep = this.repartidorRepository.create({
      usuario_id: usuario.id,
      tipo_vehiculo_id: tipoVehiculoRel?.id,
      tipo_vehiculo: (tipoVehiculoRel?.codigo as TipoVehiculoEnum) || body.tipo_vehiculo || TipoVehiculoEnum.MOTOCICLETA,
      placa: body.placa.toUpperCase().trim(),
      licencia_conducir: body.licencia_conducir || 'SCZ-PENDIENTE',
      capacidad_peso_min_kg: body.capacidad_peso_min_kg ?? tipoVehiculoRel?.peso_min_kg ?? 0.1,
      capacidad_peso_max_kg: body.capacidad_peso_max_kg ?? tipoVehiculoRel?.peso_max_kg ?? 20.0,
      tamano_maximo: body.tamano_maximo ?? tipoVehiculoRel?.tamano_maximo ?? TamanoRepuestoEnum.PEQUENO,
      latitud_actual: body.latitud ?? -17.7833,
      longitud_actual: body.longitud ?? -63.1821,
      esta_activo: false,
      esta_verificado: false,
    });

    return this.repartidorRepository.save(nuevoRep);
  }

  async aprobarRepartidor(id: string): Promise<Repartidor> {
    const rep = await this.findById(id);
    rep.esta_verificado = true;
    rep.esta_activo = true;
    await this.usuariosService.cambiarEstadoCuenta(rep.usuario_id, 'ACTIVO');
    return this.repartidorRepository.save(rep);
  }

  async rechazarRepartidor(id: string): Promise<Repartidor> {
    const rep = await this.findById(id);
    rep.esta_verificado = false;
    rep.esta_activo = false;
    await this.usuariosService.cambiarEstadoCuenta(rep.usuario_id, 'RECHAZADO');
    return this.repartidorRepository.save(rep);
  }

  async actualizarUbicacion(id: string, latitud: number, longitud: number): Promise<Repartidor> {
    const rep = await this.findById(id);
    rep.latitud_actual = latitud;
    rep.longitud_actual = longitud;
    return this.repartidorRepository.save(rep);
  }

  async cambiarEstadoActivo(id: string, estaActivo: boolean): Promise<Repartidor> {
    const rep = await this.findById(id);
    rep.esta_activo = estaActivo;
    return this.repartidorRepository.save(rep);
  }

  async actualizarCapacidad(
    id: string,
    capacidadMin: number,
    capacidadMax: number,
    tamanoMaximo: TamanoRepuestoEnum,
  ): Promise<Repartidor> {
    const rep = await this.findById(id);
    rep.capacidad_peso_min_kg = Number(capacidadMin);
    rep.capacidad_peso_max_kg = Number(capacidadMax);
    rep.tamano_maximo = tamanoMaximo;
    return this.repartidorRepository.save(rep);
  }
}
