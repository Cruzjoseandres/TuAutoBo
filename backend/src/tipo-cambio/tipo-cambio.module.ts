import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoCambio } from './entities/tipo-cambio.entity';
import { TipoCambioService } from './tipo-cambio.service';
import { TipoCambioController } from './tipo-cambio.controller';
import { ParametrosModule } from '../parametros/parametros.module';

@Module({
  imports: [TypeOrmModule.forFeature([TipoCambio]), ParametrosModule],
  controllers: [TipoCambioController],
  providers: [TipoCambioService],
  exports: [TipoCambioService, TypeOrmModule],
})
export class TipoCambioModule {}

