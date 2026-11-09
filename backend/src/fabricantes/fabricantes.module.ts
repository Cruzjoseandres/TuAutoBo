import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fabricante } from './entities/fabricante.entity';
import { FabricantesService } from './fabricantes.service';
import { FabricantesController } from './fabricantes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Fabricante])],
  controllers: [FabricantesController],
  providers: [FabricantesService],
  exports: [FabricantesService, TypeOrmModule],
})
export class FabricantesModule {}

