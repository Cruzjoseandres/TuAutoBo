import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Marca } from './entities/marca.entity';
import { MarcasService } from './marcas.service';
import { MarcasController } from './marcas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Marca])],
  controllers: [MarcasController],
  providers: [MarcasService],
  exports: [MarcasService, TypeOrmModule],
})
export class MarcasModule {}

