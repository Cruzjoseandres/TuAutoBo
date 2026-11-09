import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { RolEnum } from '../common/enums';
import type { Rol } from './entities/rol.entity';

@ApiTags('Roles (Módulo de Roles del Sistema)')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los roles del sistema (Comprador, Vendedor, Repartidor, Administrador)' })
  findAll(): Promise<Rol[]> {
    return this.rolesService.findAll();
  }

  @Get(':nombre')
  @ApiOperation({ summary: 'Obtener información de un rol por su nombre enum' })
  findByNombre(@Param('nombre') nombre: RolEnum): Promise<Rol> {
    return this.rolesService.findByNombre(nombre);
  }
}

