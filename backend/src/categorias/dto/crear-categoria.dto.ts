import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearCategoriaDto {
  @ApiProperty({ example: 'Frenos', description: 'Nombre de la categoría' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Pastillas, discos y tambores de freno', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ example: 'disc', description: 'Identificador del icono', required: false })
  @IsString()
  @IsOptional()
  icono?: string;
}

