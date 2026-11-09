import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';
import { ModelosModule } from '../modelos/modelos.module';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo]), ModelosModule],
  controllers: [VehiculosController],
  providers: [VehiculosService],
  exports: [VehiculosService, TypeOrmModule],
})
export class VehiculosModule {}

