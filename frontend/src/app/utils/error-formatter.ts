export function formatearErrorHttp(err: any, fallback: string = 'Ocurrió un error inesperado.'): string {
  if (!err) return fallback;

  // 1. Mensaje estructurado de NestJS (puede ser array de validaciones o string)
  if (Array.isArray(err?.error?.message)) {
    return err.error.message.join(' • ');
  }

  if (typeof err?.error?.message === 'string') {
    const msg = err.error.message;
    // Traducciones de respaldo por si alguna librería externa emite errores en inglés
    if (msg.includes('must be an email')) {
      return 'El correo electrónico debe tener un formato válido (ej. usuario@gmail.com).';
    }
    if (msg.includes('should not be empty')) {
      return 'Por favor completa todos los campos obligatorios.';
    }
    if (msg.includes('must be longer than')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    return msg;
  }

  // 2. Errores por código HTTP
  if (err.status === 0) {
    return 'No se pudo conectar con el servidor de TuAuto. Verifica que el backend esté activo.';
  }
  if (err.status === 401) {
    return 'Credenciales incorrectas o sesión no autorizada.';
  }
  if (err.status === 403) {
    return 'No tienes los permisos necesarios para realizar esta acción.';
  }
  if (err.status === 404) {
    return 'El registro o elemento solicitado no fue encontrado.';
  }
  if (err.status === 409) {
    return 'El correo electrónico o identificador ya se encuentra registrado.';
  }
  if (err.status >= 500) {
    return 'Error interno en el servidor. Por favor intenta de nuevo en unos momentos.';
  }

  return err?.message || fallback;
}

