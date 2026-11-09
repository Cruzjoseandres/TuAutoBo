import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Modelo } from './entities/modelo.entity';
import { ModelosService } from './modelos.service';
import { ModelosController } from './modelos.controller';
import { MarcasModule } from '../marcas/marcas.module';

@Module({
  imports: [TypeOrmModule.forFeature([Modelo]), MarcasModule],
  controllers: [ModelosController],
  providers: [ModelosService],
  exports: [ModelosService, TypeOrmModule],
})
export class ModelosModule {}

