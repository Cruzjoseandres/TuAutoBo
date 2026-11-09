import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { TipoCombustibleEnum, TipoTransmisionEnum } from '../../common/enums';

export class CrearVehiculoDto {
  @ApiProperty({ example: 2018, description: 'Año de fabricación del vehículo' })
  @IsNumber()
  @IsNotEmpty()
  anio: number;

  @ApiProperty({ example: '1.8L 2ZR-FE', description: 'Código o denominación del motor' })
  @IsString()
  @IsNotEmpty()
  motor: string;

  @ApiProperty({ example: '1800cc', description: 'Cilindrada del motor' })
  @IsString()
  @IsNotEmpty()
  cilindrada: string;

  @ApiProperty({ enum: TipoCombustibleEnum, example: TipoCombustibleEnum.GASOLINA })
  @IsEnum(TipoCombustibleEnum)
  @IsNotEmpty()
  tipo_combustible: TipoCombustibleEnum;

  @ApiProperty({ enum: TipoTransmisionEnum, example: TipoTransmisionEnum.AUTOMATICA })
  @IsEnum(TipoTransmisionEnum)
  @IsNotEmpty()
  transmision: TipoTransmisionEnum;

  @ApiProperty({ example: 1, description: 'ID del modelo al que pertenece' })
  @IsNumber()
  @IsNotEmpty()
  modelo_id: number;
}

