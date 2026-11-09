import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const rol = auth.rolPrincipal();

  let cloned = req;
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (rol) {
    headers['x-user-role'] = rol;
  }

  if (Object.keys(headers).length > 0) {
    cloned = req.clone({ setHeaders: headers });
  }

  return next(cloned).pipe(
    catchError((err) => {
      if (err.status === 401) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
