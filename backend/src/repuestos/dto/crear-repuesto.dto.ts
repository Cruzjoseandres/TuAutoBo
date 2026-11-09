import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  MonedaEnum,
  TamanoRepuestoEnum,
  CondicionRepuestoEnum,
} from '../../common/enums';

export class CrearRepuestoDto {
  @ApiProperty({ example: 'Juego de Pastillas Delanteras Cerámicas' })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({ example: 'BRK-TOY-001' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: '04465-02220', required: false })
  @IsString()
  @IsOptional()
  numero_oem?: string;

  @ApiProperty({ example: 'Pastillas de freno cerámicas japonesas de alto rendimiento y cero ruido.' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80' })
  @IsString()
  @IsNotEmpty()
  url_imagen: string;

  @ApiProperty({ enum: MonedaEnum, example: MonedaEnum.BOB })
  @IsEnum(MonedaEnum)
  @IsNotEmpty()
  moneda_base: MonedaEnum;

  @ApiProperty({ example: 280.0, description: 'Precio fijado en la moneda_base' })
  @IsNumber()
  @IsPositive()
  precio_base: number;

  @ApiProperty({ example: 12, description: 'Stock inicial físico en tienda' })
  @IsNumber()
  @Min(0)
  stock_disponible: number;

  @ApiProperty({ example: 2, description: 'Stock mínimo para alerta de reposición' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock_minimo?: number;

  @ApiProperty({ example: true, description: 'Indica si el producto está publicado y activo' })
  @IsOptional()
  esta_activo?: boolean;

  @ApiProperty({ example: 1.8, description: 'Peso físico en kg del repuesto' })
  @IsNumber()
  @IsPositive()
  peso_kg: number;

  @ApiProperty({ enum: TamanoRepuestoEnum, example: TamanoRepuestoEnum.PEQUENO })
  @IsEnum(TamanoRepuestoEnum)
  @IsNotEmpty()
  tamano: TamanoRepuestoEnum;

  @ApiProperty({ enum: CondicionRepuestoEnum, example: CondicionRepuestoEnum.NUEVO_ORIGINAL_OEM })
  @IsEnum(CondicionRepuestoEnum)
  @IsNotEmpty()
  condicion: CondicionRepuestoEnum;

  @ApiProperty({ example: 6, description: 'Meses de garantía oficial de la tienda' })
  @IsNumber()
  @IsOptional()
  meses_garantia?: number;

  @ApiProperty({ example: 2.0, description: 'Horas estimadas de despacho' })
  @IsNumber()
  @IsOptional()
  tiempo_entrega_horas?: number;

  @ApiProperty({ example: 1, description: 'ID de la Categoría' })
  @IsNumber()
  @IsNotEmpty()
  categoria_id: number;

  @ApiProperty({ example: 1, description: 'ID del Fabricante' })
  @IsNumber()
  @IsNotEmpty()
  fabricante_id: number;

  @ApiProperty({ example: 1, description: 'ID de la Configuración de Vehículo' })
  @IsNumber()
  @IsNotEmpty()
  vehiculo_id: number;

  @ApiProperty({ example: 'a0e008fc-ec06-4fb9-8a24-7cb4ffdf5011', description: 'UUID de la Tienda' })
  @IsUUID()
  @IsNotEmpty()
  tienda_id: string;
}

