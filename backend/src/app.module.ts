import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

import { RolesModule } from './roles/roles.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { MarcasModule } from './marcas/marcas.module';
import { ModelosModule } from './modelos/modelos.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { CategoriasModule } from './categorias/categorias.module';
import { FabricantesModule } from './fabricantes/fabricantes.module';
import { TiendasModule } from './tiendas/tiendas.module';
import { RepartidoresModule } from './repartidores/repartidores.module';
import { TiposVehiculoModule } from './tipos-vehiculo/tipos-vehiculo.module';
import { TipoCambioModule } from './tipo-cambio/tipo-cambio.module';
import { ParametrosModule } from './parametros/parametros.module';
import { RepuestosModule } from './repuestos/repuestos.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { MensajesModule } from './mensajes/mensajes.module';
import { UploadModule } from './upload/upload.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      autoLoadEntities: true,
      synchronize: true,
      dropSchema: process.env.DB_DROP_SCHEMA === 'true',
    }),
    RolesModule,
    UsuariosModule,
    MarcasModule,
    ModelosModule,
    VehiculosModule,
    CategoriasModule,
    FabricantesModule,
    TiendasModule,
    RepartidoresModule,
    TiposVehiculoModule,
    TipoCambioModule,
    ParametrosModule,
    RepuestosModule,
    PedidosModule,
    MensajesModule,
    UploadModule,
    RealtimeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
