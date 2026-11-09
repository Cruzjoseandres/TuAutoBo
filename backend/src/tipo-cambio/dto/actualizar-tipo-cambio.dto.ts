import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class ActualizarTipoCambioDto {
  @ApiProperty({ example: 6.96, description: 'Valor de 1 USD en BOB' })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  tasa_cambio: number;

  @ApiProperty({ example: 'Actualización Manual Admin', required: false })
  @IsString()
  @IsOptional()
  fuente?: string;
}

