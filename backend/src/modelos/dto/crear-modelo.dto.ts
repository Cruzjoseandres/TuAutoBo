import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CrearModeloDto {
  @ApiProperty({ example: 'Corolla', description: 'Nombre del modelo de vehículo' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 1, description: 'ID de la marca a la que pertenece' })
  @IsNumber()
  @IsNotEmpty()
  marca_id: number;
}

