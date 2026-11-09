import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RolEnum } from '../../common/enums';

export class CrearUsuarioDto {
  @ApiProperty({ example: 'juan.perez@gmail.com' })
  @IsEmail({}, { message: 'El correo electrónico debe ser una dirección válida (ej. usuario@gmail.com).' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  correo: string;

  @ApiProperty({ example: 'clave123' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  clave: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString({ message: 'El nombre completo debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre completo es obligatorio.' })
  nombre_completo: string;

  @ApiPropertyOptional({ example: '+591 76012345' })
  @IsString({ message: 'El teléfono debe ser texto.' })
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({ example: 'Equipetrol, 3er Anillo' })
  @IsString({ message: 'La ciudad o zona debe ser texto.' })
  @IsOptional()
  ciudad_zona?: string;

  @ApiPropertyOptional({ example: 'ACTIVO' })
  @IsString({ message: 'El estado de la cuenta debe ser texto.' })
  @IsOptional()
  estado_cuenta?: string;

  @ApiProperty({ enum: RolEnum, example: RolEnum.COMPRADOR })
  @IsEnum(RolEnum, { message: 'El rol seleccionado no es válido. Opciones: COMPRADOR, VENDEDOR, REPARTIDOR, ADMINISTRADOR.' })
  rol: RolEnum;
}

export class LoginUsuarioDto {
  @ApiProperty({ example: 'comprador@tuauto.bo' })
  @IsEmail({}, { message: 'Ingresa un correo electrónico con formato válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido para ingresar.' })
  correo: string;

  @ApiProperty({ example: 'comprador123' })
  @IsString({ message: 'La contraseña debe ser texto.' })
  @IsNotEmpty({ message: 'La contraseña es requerida para ingresar.' })
  clave: string;
}
