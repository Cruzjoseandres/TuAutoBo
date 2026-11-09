import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto, LoginUsuarioDto } from './dto';
import type { Usuario } from './entities/usuario.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolEnum } from '../common/enums';

@ApiTags('Usuarios & Auth (Módulo de Usuarios y Autenticación)')
@Controller('usuarios')
@UseGuards(RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('registro')
  @ApiOperation({ summary: 'Registrar nuevo usuario asignándole un rol inicial' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  registrar(@Body() dto: CrearUsuarioDto) {
    return this.usuariosService.registrarConSesion(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener rol y token de acceso' })
  login(@Body() dto: LoginUsuarioDto) {
    return this.usuariosService.login(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  findAll(): Promise<Usuario[]> {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  findById(@Param('id') id: string): Promise<Usuario> {
    return this.usuariosService.findById(id);
  }

  @Get(':id/direcciones')
  @ApiOperation({ summary: 'Obtener libreta de direcciones guardadas del comprador (tipo PedidosYa)' })
  obtenerDirecciones(@Param('id') id: string) {
    return this.usuariosService.obtenerDirecciones(id);
  }

  @Post(':id/direcciones')
  @ApiOperation({ summary: 'Guardar una nueva dirección favorita en Santa Cruz' })
  agregarDireccion(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.usuariosService.agregarDireccion(id, body);
  }

  @Patch(':id/estado')
  @Roles(RolEnum.ADMINISTRADOR)
  @ApiOperation({ summary: 'Aprobar o rechazar cuenta de usuario (Solo Administrador)' })
  cambiarEstado(
    @Param('id') id: string,
    @Body('estado_cuenta') estadoCuenta: string,
  ): Promise<Usuario> {
    return this.usuariosService.cambiarEstadoCuenta(id, estadoCuenta);
  }
}

