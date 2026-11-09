import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearFabricanteDto {
  @ApiProperty({ example: 'Denso', description: 'Nombre de la marca fabricante' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Japón', description: 'País de origen', required: false })
  @IsString()
  @IsOptional()
  pais_origen?: string;
}

