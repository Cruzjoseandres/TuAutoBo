import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../environments/environment';

export interface InfoVersionApp {
  version: string;
  apk_url: string;
  novedades: string;
  obligatoria: boolean;
  fecha_actualizacion: string;
}

@Injectable({
  providedIn: 'root',
})
export class VersionCheckService {
  private readonly http = inject(HttpClient);

  // Versión local actual instalada en la aplicación
  readonly VERSION_ACTUAL = '1.2.0';

  // Detecta si se está ejecutando dentro del contenedor nativo APK Android (Capacitor)
  readonly esAppNativa = signal<boolean>(this.detectarPlataformaNativa());

  // Signals reactivos
  readonly comprobando = signal<boolean>(false);
  readonly hayNuevaVersion = signal<boolean>(false);
  readonly infoActualizacion = signal<InfoVersionApp | null>(null);
  readonly modalVisible = signal<boolean>(false);

  constructor() {
    this.verificarVersion();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.verificarVersion();
        }
      });
    }
  }

  private detectarPlataformaNativa(): boolean {
    try {
      if (Capacitor.isNativePlatform()) {
        return true;
      }
      if (typeof window !== 'undefined') {
        const ua = window.navigator.userAgent || '';
        const esWebViewAndroid = /;\s*wv\)/.test(ua) || (/Android/i.test(ua) && /Version\/[\d.]+/i.test(ua));
        const capGlobal = (window as any).Capacitor;
        if (capGlobal?.isNativePlatform?.() || esWebViewAndroid) {
          return true;
        }
      }
    } catch {
      // Fallback silencioso
    }
    return false;
  }

  verificarVersion(): void {
    this.comprobando.set(true);
    this.http.get<InfoVersionApp>(`${environment.apiUrl}/parametros/app-version`).subscribe({
      next: (info) => {
        this.comprobando.set(false);
        if (this.esVersionMayor(info.version, this.VERSION_ACTUAL)) {
          this.hayNuevaVersion.set(true);
          this.infoActualizacion.set(info);
          this.modalVisible.set(true);
        }
      },
      error: () => {
        this.comprobando.set(false);
      },
    });
  }

  abrirModal(): void {
    if (this.hayNuevaVersion()) {
      this.modalVisible.set(true);
    }
  }

  cerrarModal(): void {
    if (!this.infoActualizacion()?.obligatoria) {
      this.modalVisible.set(false);
    }
  }

  descargarInstalador(): void {
    const url =
      this.infoActualizacion()?.apk_url ||
      'https://github.com/Cruzjoseandres/TuAutoBo/releases/latest/download/TuAuto.apk';
    window.open(url, '_system');
  }

  private esVersionMayor(versionServidor: string, versionLocal: string): boolean {
    if (!versionServidor || !versionLocal) return false;
    const vServidor = versionServidor.split('.').map((n) => parseInt(n, 10) || 0);
    const vLocal = versionLocal.split('.').map((n) => parseInt(n, 10) || 0);

    for (let i = 0; i < Math.max(vServidor.length, vLocal.length); i++) {
      const numServidor = vServidor[i] || 0;
      const numLocal = vLocal[i] || 0;
      if (numServidor > numLocal) return true;
      if (numServidor < numLocal) return false;
    }
    return false;
  }
}
