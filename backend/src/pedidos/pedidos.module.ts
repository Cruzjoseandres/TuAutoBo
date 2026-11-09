import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './entities/pedido.entity';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { RepuestosModule } from '../repuestos/repuestos.module';
import { TiendasModule } from '../tiendas/tiendas.module';
import { ParametrosModule } from '../parametros/parametros.module';
import { TipoCambioModule } from '../tipo-cambio/tipo-cambio.module';
import { RepartidoresModule } from '../repartidores/repartidores.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import {
  MotoLogisticaStrategy,
  ToritoLogisticaStrategy,
  AutoLogisticaStrategy,
  CamionetaLogisticaStrategy,
  RetiroTiendaStrategy,
  LogisticaContext,
} from './strategies';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido]),
    RepuestosModule,
    TiendasModule,
    ParametrosModule,
    TipoCambioModule,
    RepartidoresModule,
    UsuariosModule,
  ],
  controllers: [PedidosController],
  providers: [
    PedidosService,
    MotoLogisticaStrategy,
    ToritoLogisticaStrategy,
    AutoLogisticaStrategy,
    CamionetaLogisticaStrategy,
    RetiroTiendaStrategy,
    LogisticaContext,
  ],
  exports: [PedidosService, LogisticaContext, TypeOrmModule],
})
export class PedidosModule {}

