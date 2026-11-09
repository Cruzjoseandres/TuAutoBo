import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CrearMensajeDto {
  @ApiProperty({ example: 'Buenas tardes, ¿estas pastillas sirven para mi Corolla 2018 chasis ZRE182?' })
  @IsString()
  @IsNotEmpty()
  texto: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400' })
  @IsString()
  @IsOptional()
  url_imagen?: string;

  @ApiPropertyOptional({ example: false, description: 'True si es una respuesta técnica oficial de compatibilidad 100%' })
  @IsBoolean()
  @IsOptional()
  es_confirmacion_compatibilidad?: boolean;

  @ApiProperty({ example: 'COMPRADOR', description: 'COMPRADOR o TIENDA' })
  @IsString()
  @IsNotEmpty()
  remitente_tipo: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  remitente_nombre: string;

  @ApiProperty({ example: 'a0e008fc-ec06-4fb9-8a24-7cb4ffdf5010' })
  @IsUUID()
  @IsNotEmpty()
  usuario_id: string;

  @ApiProperty({ example: 'b0e008fc-ec06-4fb9-8a24-7cb4ffdf5012' })
  @IsUUID()
  @IsNotEmpty()
  tienda_id: string;

  @ApiPropertyOptional({ example: 'c0e008fc-ec06-4fb9-8a24-7cb4ffdf5020' })
  @IsUUID()
  @IsOptional()
  repuesto_id?: string;
}

