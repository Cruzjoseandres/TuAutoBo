import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { formatearErrorHttp } from '../../../utils/error-formatter';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);

  correo = signal<string>('');
  clave = signal<string>('');
  cargando = signal<boolean>(false);

  // Errores específicos por campo (inline debajo del input)
  errorCorreo = signal<string | null>(null);
  errorClave = signal<string | null>(null);

  // Error general superior reservado para respuestas del servidor (401 credenciales, 500, sin red)
  errorGeneral = signal<string | null>(null);

  onCorreoChange(val: string) {
    this.correo.set(val);
    if (this.errorCorreo()) this.errorCorreo.set(null);
  }

  onClaveChange(val: string) {
    this.clave.set(val);
    if (this.errorClave()) this.errorClave.set(null);
  }

  validar(): boolean {
    let valido = true;
    this.errorGeneral.set(null);

    const email = this.correo().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email) {
      this.errorCorreo.set('El correo electrónico es obligatorio.');
      valido = false;
    } else if (!emailRegex.test(email)) {
      this.errorCorreo.set('Ingresa un correo electrónico con formato válido (ej. usuario@gmail.com).');
      valido = false;
    } else {
      this.errorCorreo.set(null);
    }

    if (!this.clave()) {
      this.errorClave.set('La contraseña es obligatoria.');
      valido = false;
    } else {
      this.errorClave.set(null);
    }

    return valido;
  }

  iniciarSesion() {
    if (!this.validar()) {
      return;
    }

    this.errorGeneral.set(null);
    this.cargando.set(true);

    this.auth.login(this.correo().trim(), this.clave()).subscribe({
      next: () => {
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        if (err?.status === 401) {
          this.errorGeneral.set('Usuario o contraseña incorrecta. Verifica tus credenciales e intenta de nuevo.');
        } else if (err?.status === 403) {
          this.errorGeneral.set('Esta cuenta aún se encuentra pendiente de verificación o ha sido suspendida.');
        } else {
          this.errorGeneral.set(
            formatearErrorHttp(err, 'No se pudo conectar con el servidor. Intente de nuevo más tarde.')
          );
        }
      },
    });
  }
}
