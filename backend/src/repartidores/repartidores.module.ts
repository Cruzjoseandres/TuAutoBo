import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repartidor } from './entities/repartidor.entity';
import { RepartidoresService } from './repartidores.service';
import { RepartidoresController } from './repartidores.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { TiposVehiculoModule } from '../tipos-vehiculo/tipos-vehiculo.module';

@Module({
  imports: [TypeOrmModule.forFeature([Repartidor]), UsuariosModule, TiposVehiculoModule],
  controllers: [RepartidoresController],
  providers: [RepartidoresService],
  exports: [RepartidoresService, TypeOrmModule],
})
export class RepartidoresModule {}

