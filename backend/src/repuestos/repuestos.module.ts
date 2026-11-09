import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repuesto } from './entities/repuesto.entity';
import { RepuestosService } from './repuestos.service';
import { RepuestosController } from './repuestos.controller';
import { TipoCambioModule } from '../tipo-cambio/tipo-cambio.module';
import { ParametrosModule } from '../parametros/parametros.module';
import { TiendasModule } from '../tiendas/tiendas.module';
import { VehiculosModule } from '../vehiculos/vehiculos.module';
import { CategoriasModule } from '../categorias/categorias.module';
import { FabricantesModule } from '../fabricantes/fabricantes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repuesto]),
    TipoCambioModule,
    ParametrosModule,
    TiendasModule,
    VehiculosModule,
    CategoriasModule,
    FabricantesModule,
  ],
  controllers: [RepuestosController],
  providers: [RepuestosService],
  exports: [RepuestosService, TypeOrmModule],
})
export class RepuestosModule {}

