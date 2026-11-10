import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const rolRequerido = route.data?.['rol'] as string;
  if (!rolRequerido) return true;

  if (auth.estaAutenticado() && auth.tieneRol(rolRequerido)) {
    return true;
  }

  return router.createUrlTree(auth.obtenerRutaPrincipalPorRol());
};
