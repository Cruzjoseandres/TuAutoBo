import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { PlanTiendaEnum, TipoEstablecimientoEnum } from '../../common/enums';

export class CrearTiendaDto {
  @ApiProperty({ enum: TipoEstablecimientoEnum, example: TipoEstablecimientoEnum.TIENDA_REPUESTOS, required: false })
  @IsEnum(TipoEstablecimientoEnum)
  @IsOptional()
  tipo_establecimiento?: TipoEstablecimientoEnum;

  @ApiProperty({ example: 'Importadora Repuestos Tokio', description: 'Nombre comercial de la tienda' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: -17.7765, description: 'Latitud geográfica en Google Maps' })
  @IsNumber()
  @IsNotEmpty()
  latitud: number;

  @ApiProperty({ example: -63.1812, description: 'Longitud geográfica en Google Maps' })
  @IsNumber()
  @IsNotEmpty()
  longitud: number;

  @ApiProperty({ example: 'Av. Cristóbal de Mendoza #450, 2do Anillo', description: 'Dirección física detallada' })
  @IsString()
  @IsNotEmpty()
  direccion_escrita: string;

  @ApiProperty({ example: 'Frente al surtidor Genex', required: false })
  @IsString()
  @IsOptional()
  referencia?: string;

  @ApiProperty({ example: '+591 77012345', description: 'Teléfono o WhatsApp de contacto' })
  @IsString()
  @IsNotEmpty()
  telefono: string;

  @ApiProperty({ example: 'Toyota, Nissan, Suzuki', description: 'Especialidad en marcas de repuestos', required: false })
  @IsString()
  @IsOptional()
  especialidad?: string;

  @ApiProperty({ example: 'Diagnóstico computarizado, Frenos y Suspensión', description: 'Servicios mecánicos ofrecidos', required: false })
  @IsString()
  @IsOptional()
  servicios_taller?: string;

  @ApiProperty({ enum: PlanTiendaEnum, example: PlanTiendaEnum.GRATUITO, required: false })
  @IsEnum(PlanTiendaEnum)
  @IsOptional()
  plan_suscripcion?: PlanTiendaEnum;

  @ApiProperty({ example: 'b0e008fc-ec06-4fb9-8a24-7cb4ffdf5012', description: 'UUID del usuario propietario' })
  @IsUUID()
  @IsNotEmpty()
  usuario_id: string;
}

