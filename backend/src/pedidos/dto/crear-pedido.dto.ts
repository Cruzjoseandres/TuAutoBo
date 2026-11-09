import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  MonedaEnum,
  MetodoPagoEnum,
  TipoEntregaEnum,
} from '../../common/enums';

export class CrearPedidoDto {
  @ApiProperty({ example: 'a0e008fc-ec06-4fb9-8a24-7cb4ffdf5010', description: 'UUID del usuario comprador' })
  @IsUUID()
  @IsNotEmpty()
  usuario_comprador_id: string;

  @ApiProperty({ example: 'c0e008fc-ec06-4fb9-8a24-7cb4ffdf5020', description: 'UUID del repuesto a comprar' })
  @IsUUID()
  @IsNotEmpty()
  repuesto_id: string;

  @ApiProperty({ enum: MonedaEnum, example: MonedaEnum.BOB, description: 'Moneda en la que el cliente paga' })
  @IsEnum(MonedaEnum)
  @IsNotEmpty()
  moneda_pago: MonedaEnum;

  @ApiProperty({ enum: MetodoPagoEnum, example: MetodoPagoEnum.QR_SIMPLE })
  @IsEnum(MetodoPagoEnum)
  @IsNotEmpty()
  metodo_pago: MetodoPagoEnum;

  @ApiProperty({ enum: TipoEntregaEnum, example: TipoEntregaEnum.DELIVERY_MOTO })
  @IsEnum(TipoEntregaEnum)
  @IsNotEmpty()
  tipo_entrega: TipoEntregaEnum;

  @ApiPropertyOptional({ example: -17.7833 })
  @IsNumber()
  @IsOptional()
  latitud_entrega?: number;

  @ApiPropertyOptional({ example: -63.1821 })
  @IsNumber()
  @IsOptional()
  longitud_entrega?: number;

  @ApiPropertyOptional({ example: 'Calle Beni #350, Barrio Las Palmas' })
  @IsString()
  @IsOptional()
  direccion_escrita?: string;

  @ApiPropertyOptional({ example: 'Portón negro, timbrar al intercomunicador 2B' })
  @IsString()
  @IsOptional()
  referencia?: string;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Cantidad de unidades del repuesto' })
  @IsNumber()
  @IsOptional()
  cantidad?: number;
}

export class CotizarEnvioDto {
  @ApiProperty({ example: 'c0e008fc-ec06-4fb9-8a24-7cb4ffdf5020' })
  @IsUUID()
  @IsNotEmpty()
  repuesto_id: string;

  @ApiProperty({ enum: TipoEntregaEnum, example: TipoEntregaEnum.DELIVERY_MOTO })
  @IsEnum(TipoEntregaEnum)
  @IsNotEmpty()
  tipo_entrega: TipoEntregaEnum;

  @ApiPropertyOptional({ example: -17.7833 })
  @IsNumber()
  @IsOptional()
  latitud_entrega?: number;

  @ApiPropertyOptional({ example: -63.1821 })
  @IsNumber()
  @IsOptional()
  longitud_entrega?: number;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Cantidad de unidades' })
  @IsNumber()
  @IsOptional()
  cantidad?: number;
}

export class ConfirmarPagoDto {
  @ApiProperty({ example: 'BNB-QR-784910294-OK' })
  @IsString()
  @IsNotEmpty()
  codigo_autorizacion_banco: string;
}

export class ConfirmarPinDto {
  @ApiProperty({ example: '4829', description: 'PIN de 4 dígitos proporcionado al comprador' })
  @IsString()
  @IsNotEmpty()
  pin: string;
}

export class AbrirDisputaDto {
  @ApiProperty({ example: 'El repuesto no coincide con las medidas de mi vehículo' })
  @IsString()
  @IsNotEmpty()
  motivo: string;
}

