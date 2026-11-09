import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { TamanoRepuestoEnum, CondicionRepuestoEnum } from '../../common/enums';

export class FiltrarRepuestosDto {
  @ApiPropertyOptional({ description: 'ID de la marca' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  marca_id?: number;

  @ApiPropertyOptional({ description: 'ID del modelo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  modelo_id?: number;

  @ApiPropertyOptional({ description: 'ID del vehículo específico (año y motor)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vehiculo_id?: number;

  @ApiPropertyOptional({ description: 'ID de la categoría' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoria_id?: number;

  @ApiPropertyOptional({ description: 'Búsqueda por texto en título, SKU o número OEM' })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiPropertyOptional({ enum: CondicionRepuestoEnum })
  @IsOptional()
  @IsEnum(CondicionRepuestoEnum)
  condicion?: CondicionRepuestoEnum;

  @ApiPropertyOptional({ enum: TamanoRepuestoEnum })
  @IsOptional()
  @IsEnum(TamanoRepuestoEnum)
  tamano?: TamanoRepuestoEnum;

  @ApiPropertyOptional({ description: 'Ordenar por: PRECIO_ASC, PRECIO_DESC, RECIENTES' })
  @IsOptional()
  @IsString()
  orden?: 'PRECIO_ASC' | 'PRECIO_DESC' | 'RECIENTES';

  @ApiPropertyOptional({ description: 'Número de página (1 por defecto)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pagina?: number;

  @ApiPropertyOptional({ description: 'Cantidad máxima de resultados por consulta (12 por defecto)', default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limite?: number;
}

