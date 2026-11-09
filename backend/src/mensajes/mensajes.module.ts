import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mensaje } from './entities/mensaje.entity';
import { MensajesService } from './mensajes.service';
import { MensajesController } from './mensajes.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { TiendasModule } from '../tiendas/tiendas.module';
import { RepuestosModule } from '../repuestos/repuestos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mensaje]),
    UsuariosModule,
    TiendasModule,
    RepuestosModule,
  ],
  controllers: [MensajesController],
  providers: [MensajesService],
  exports: [MensajesService, TypeOrmModule],
})
export class MensajesModule {}

