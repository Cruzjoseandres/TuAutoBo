import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tienda } from './entities/tienda.entity';
import { TiendasService } from './tiendas.service';
import { TiendasController } from './tiendas.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tienda]), UsuariosModule],
  controllers: [TiendasController],
  providers: [TiendasService],
  exports: [TiendasService, TypeOrmModule],
})
export class TiendasModule {}

