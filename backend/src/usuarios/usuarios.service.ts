import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CrearUsuarioDto, LoginUsuarioDto } from './dto';
import { RolesService } from '../roles/roles.service';
import { RolEnum } from '../common/enums';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly rolesService: RolesService,
  ) {}

  async registrar(dto: CrearUsuarioDto): Promise<Usuario> {
    const correoNormalizado = dto.correo.toLowerCase().trim();
    const existe = await this.usuarioRepository.findOne({
      where: { correo: correoNormalizado },
    });
    if (existe) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const rol = await this.rolesService.findByNombre(dto.rol);
    const requiereAprobacion =
      dto.rol === RolEnum.VENDEDOR || dto.rol === RolEnum.REPARTIDOR;
    const estadoInicial =
      dto.estado_cuenta ||
      (requiereAprobacion ? 'PENDIENTE_APROBACION' : 'ACTIVO');

    const nuevo = this.usuarioRepository.create({
      correo: correoNormalizado,
      clave: dto.clave,
      nombre_completo: dto.nombre_completo,
      telefono: dto.telefono,
      ciudad_zona: dto.ciudad_zona || 'Santa Cruz de la Sierra',
      estado_cuenta: estadoInicial,
      roles: [rol],
      direcciones: [],
    });

    return this.usuarioRepository.save(nuevo);
  }

  async registrarConSesion(dto: CrearUsuarioDto) {
    const usuario = await this.registrar(dto);
    const rolesNombres = usuario.roles.map((r) => r.nombre);
    const token =
      usuario.estado_cuenta === 'ACTIVO'
        ? `jwt-${rolesNombres.join('_')}-${usuario.id}-${Date.now()}`
        : null;

    return {
      id: usuario.id,
      correo: usuario.correo,
      nombre_completo: usuario.nombre_completo,
      telefono: usuario.telefono,
      ciudad_zona: usuario.ciudad_zona,
      estado_cuenta: usuario.estado_cuenta,
      roles: rolesNombres,
      direcciones: usuario.direcciones || [],
      token,
    };
  }

  async login(dto: LoginUsuarioDto) {
    // Al tener select: false, requerimos addSelect('usuario.clave') de forma segura
    const usuario = await this.usuarioRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.roles', 'roles')
      .addSelect('usuario.clave')
      .where('LOWER(usuario.correo) = :correo', {
        correo: dto.correo.toLowerCase().trim(),
      })
      .getOne();

    if (!usuario || usuario.clave !== dto.clave) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (usuario.estado_cuenta === 'PENDIENTE_APROBACION') {
      throw new UnauthorizedException(
        'Tu solicitud de afiliación está en revisión por la Administración de TuAuto. Podrás ingresar en cuanto sea aprobada.',
      );
    }

    if (usuario.estado_cuenta === 'RECHAZADO') {
      throw new UnauthorizedException(
        'Tu solicitud de afiliación fue rechazada por la Administración.',
      );
    }

    const rolesNombres = usuario.roles.map((r) => r.nombre);
    const token = `jwt-${rolesNombres.join('_')}-${usuario.id}-${Date.now()}`;

    // Inicializar lista de direcciones si es null
    if (!usuario.direcciones) {
      usuario.direcciones = [];
    }

    return {
      id: usuario.id,
      correo: usuario.correo,
      nombre_completo: usuario.nombre_completo,
      telefono: usuario.telefono,
      ciudad_zona: usuario.ciudad_zona,
      estado_cuenta: usuario.estado_cuenta,
      roles: rolesNombres,
      direcciones: usuario.direcciones,
      token,
    };
  }

  async cambiarEstadoCuenta(id: string, estado: string): Promise<Usuario> {
    const usuario = await this.findById(id);
    usuario.estado_cuenta = estado;
    return this.usuarioRepository.save(usuario);
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.find({ relations: { roles: true } });
  }

  async findByEmail(correo: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { correo: correo.toLowerCase().trim() },
      relations: { roles: true },
    });
  }

  async findById(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      relations: { roles: true },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return usuario;
  }

  // Métodos de libreta de direcciones (estilo PedidosYa)
  async obtenerDirecciones(usuarioId: string) {
    const usuario = await this.findById(usuarioId);
    return usuario.direcciones || [];
  }

  async agregarDireccion(
    usuarioId: string,
    dir: {
      alias: string;
      direccion_escrita: string;
      referencia?: string;
      latitud: number;
      longitud: number;
      es_predeterminada?: boolean;
    },
  ) {
    const usuario = await this.findById(usuarioId);
    if (!usuario.direcciones) usuario.direcciones = [];

    const nueva = {
      id: `dir-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      alias: dir.alias || 'Mi Ubicación',
      direccion_escrita: dir.direccion_escrita,
      referencia: dir.referencia || '',
      latitud: dir.latitud,
      longitud: dir.longitud,
      es_predeterminada: dir.es_predeterminada ?? false,
    };

    if (nueva.es_predeterminada) {
      usuario.direcciones.forEach((d) => (d.es_predeterminada = false));
    }

    usuario.direcciones.push(nueva);
    await this.usuarioRepository.save(usuario);
    return usuario.direcciones;
  }
}
