import { BadRequestException } from '@nestjs/common';

const DICCIONARIO_CAMPOS: Record<string, string> = {
  correo: 'El correo electrónico',
  clave: 'La contraseña',
  nombre_completo: 'El nombre completo',
  telefono: 'El número de teléfono o WhatsApp',
  ciudad_zona: 'La ciudad o zona de entrega',
  rol: 'El rol asignado',
  nombre: 'El nombre',
  nombre_tienda: 'El nombre comercial de la tienda o taller',
  nit: 'El NIT o padrón municipal',
  direccion_escrita: 'La dirección física',
  referencia: 'La referencia visual del lugar',
  tipo_vehiculo: 'El tipo de vehículo',
  placa: 'El número de placa del vehículo',
  licencia_conducir: 'La licencia de conducir',
  capacidad_peso_min_kg: 'La capacidad mínima en kg',
  capacidad_peso_max_kg: 'La capacidad máxima en kg',
  tamano_maximo: 'El tamaño máximo de paquete',
  titulo: 'El título del repuesto',
  sku: 'El código SKU',
  numero_oem: 'El número de parte OEM',
  descripcion: 'La descripción técnica',
  precio_base: 'El precio base',
  stock_disponible: 'El stock físico disponible',
  peso_kg: 'El peso en kilogramos',
  tamano: 'El tamaño del repuesto',
  condicion: 'La condición del repuesto',
  meses_garantia: 'Los meses de garantía oficial',
  tiempo_entrega_horas: 'El tiempo estimado de entrega',
  categoria_id: 'La categoría del sistema',
  fabricante_id: 'El fabricante',
  vehiculo_id: 'El vehículo compatible',
  tienda_id: 'La tienda repuestera',
  usuario_id: 'El identificador de usuario',
  pin: 'El PIN de seguridad de 4 dígitos',
  moneda_pago: 'La divisa de pago',
  metodo_pago: 'El método de pago',
  tipo_entrega: 'El tipo de entrega',
  latitud: 'La coordenada de latitud',
  longitud: 'La coordenada de longitud',
  latitud_entrega: 'La latitud de entrega',
  longitud_entrega: 'La longitud de entrega',
  repuesto_id: 'El repuesto seleccionado',
  usuario_comprador_id: 'El usuario comprador',
  repartidor_id: 'El repartidor asignado',
  motivo: 'El motivo de la solicitud o disputa',
  dias_duracion: 'Los días de duración',
  contenido: 'El contenido del mensaje',
};

export function traducirErrorValidacion(error: any): string {
  const propiedad = error.property;
  const nombreCampo = DICCIONARIO_CAMPOS[propiedad] || `El campo '${propiedad}'`;
  const constraints = error.constraints || {};

  if (constraints.isEmail) {
    return `${nombreCampo} debe tener un formato de email válido (ej. usuario@gmail.com).`;
  }
  if (constraints.isNotEmpty) {
    return `${nombreCampo} es obligatorio y no puede estar vacío.`;
  }
  if (constraints.minLength) {
    const match = constraints.minLength.match(/\d+/);
    const min = match ? match[0] : '6';
    return `${nombreCampo} debe tener al menos ${min} caracteres.`;
  }
  if (constraints.maxLength) {
    const match = constraints.maxLength.match(/\d+/);
    const max = match ? match[0] : '';
    return `${nombreCampo} no puede superar los ${max} caracteres.`;
  }
  if (constraints.isEnum) {
    return `${nombreCampo} contiene una opción no válida. Selecciona una de las opciones permitidas.`;
  }
  if (constraints.isNumber) {
    return `${nombreCampo} debe ser un valor numérico.`;
  }
  if (constraints.isString) {
    return `${nombreCampo} debe ser un texto válido.`;
  }
  if (constraints.isUuid) {
    return `${nombreCampo} debe ser un identificador UUID válido.`;
  }
  if (constraints.isBoolean) {
    return `${nombreCampo} debe ser verdadero o falso.`;
  }
  if (constraints.isPositive) {
    return `${nombreCampo} debe ser un número positivo mayor a 0.`;
  }
  if (constraints.min) {
    const match = constraints.min.match(/-?\d+(\.\d+)?/);
    return `${nombreCampo} debe ser como mínimo ${match ? match[0] : 0}.`;
  }
  if (constraints.max) {
    const match = constraints.max.match(/-?\d+(\.\d+)?/);
    return `${nombreCampo} no debe exceder ${match ? match[0] : 0}.`;
  }

  // Traducción genérica de patrones frecuentes de class-validator
  const primerMensaje = Object.values(constraints)[0] as string;
  if (primerMensaje) {
    return primerMensaje
      .replace(/must be an email/g, 'debe ser un correo electrónico válido')
      .replace(/should not be empty/g, 'es obligatorio')
      .replace(/must be a string/g, 'debe ser texto')
      .replace(/must be a number/g, 'debe ser un número')
      .replace(/must be longer than or equal to (\d+) characters/g, 'debe tener al menos $1 caracteres')
      .replace(/must be shorter than or equal to (\d+) characters/g, 'no debe exceder los $1 caracteres')
      .replace(/must be one of the following values/g, 'debe ser una opción válida de la lista');
  }

  return `${nombreCampo} no cumple con el formato requerido.`;
}

export function formatearErroresEnEspanol(errors: any[]): string[] {
  const resultado: string[] = [];
  for (const error of errors) {
    if (error.constraints) {
      resultado.push(traducirErrorValidacion(error));
    }
    if (error.children && error.children.length > 0) {
      resultado.push(...formatearErroresEnEspanol(error.children));
    }
  }
  return resultado;
}

export function crearExcepcionValidacionEspanol(errors: any[]): BadRequestException {
  const mensajes = formatearErroresEnEspanol(errors);
  const mensajeFinal = mensajes.length === 1 ? mensajes[0] : mensajes;
  return new BadRequestException(mensajeFinal);
}

