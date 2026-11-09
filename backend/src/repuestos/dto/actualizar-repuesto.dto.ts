import { PartialType } from '@nestjs/swagger';
import { CrearRepuestoDto } from './crear-repuesto.dto';

export class ActualizarRepuestoDto extends PartialType(CrearRepuestoDto) {}

