import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ActualizarParametroDto {
  @ApiProperty({ example: '2.50', description: 'Nuevo valor para el parámetro' })
  @IsString()
  @IsNotEmpty()
  valor: string;
}

export class CrearParametroDto {
  @ApiProperty({ example: 'NUEVO_PARAMETRO', description: 'Clave única del parámetro' })
  @IsString()
  @IsNotEmpty()
  clave: string;

  @ApiProperty({ example: 'Nuevo Parámetro', description: 'Nombre legible' })
  @IsString()
  @IsNotEmpty()
  nombre_parametro: string;

  @ApiProperty({ example: 'Descripción detallada del parámetro' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ example: '10.0' })
  @IsString()
  @IsNotEmpty()
  valor: string;

  @ApiProperty({ example: 'NUMERO', default: 'NUMERO' })
  @IsString()
  tipo_dato: string;
}

