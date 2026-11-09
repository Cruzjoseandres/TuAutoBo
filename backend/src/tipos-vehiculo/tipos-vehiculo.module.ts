import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoVehiculo } from './entities/tipo-vehiculo.entity';
import { TiposVehiculoService } from './tipos-vehiculo.service';
import { TiposVehiculoController } from './tipos-vehiculo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TipoVehiculo])],
  controllers: [TiposVehiculoController],
  providers: [TiposVehiculoService],
  exports: [TiposVehiculoService, TypeOrmModule],
})
export class TiposVehiculoModule {}

