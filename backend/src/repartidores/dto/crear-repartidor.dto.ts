import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { TipoVehiculoEnum, TamanoRepuestoEnum } from '../../common/enums';

export class CrearRepartidorDto {
  @ApiProperty({ example: 'b0e008fc-ec06-4fb9-8a24-7cb4ffdf5013', description: 'UUID del usuario repartidor' })
  @IsUUID()
  @IsNotEmpty()
  usuario_id: string;

  @ApiProperty({ enum: TipoVehiculoEnum, example: TipoVehiculoEnum.MOTOCICLETA })
  @IsEnum(TipoVehiculoEnum)
  @IsNotEmpty()
  tipo_vehiculo: TipoVehiculoEnum;

  @ApiProperty({ example: '5821-KLP', description: 'Número de placa del vehículo' })
  @IsString()
  @IsNotEmpty()
  placa: string;

  @ApiProperty({ example: 0.1, description: 'Capacidad mínima en kg que puede transportar' })
  @IsNumber()
  @IsNotEmpty()
  capacidad_peso_min_kg: number;

  @ApiProperty({ example: 25.0, description: 'Capacidad máxima en kg que puede transportar' })
  @IsNumber()
  @IsNotEmpty()
  capacidad_peso_max_kg: number;

  @ApiProperty({ enum: TamanoRepuestoEnum, example: TamanoRepuestoEnum.MEDIANO })
  @IsEnum(TamanoRepuestoEnum)
  @IsNotEmpty()
  tamano_maximo: TamanoRepuestoEnum;

  @ApiProperty({ example: -17.7812, required: false })
  @IsNumber()
  @IsOptional()
  latitud_actual?: number;

  @ApiProperty({ example: -63.1804, required: false })
  @IsNumber()
  @IsOptional()
  longitud_actual?: number;
}

