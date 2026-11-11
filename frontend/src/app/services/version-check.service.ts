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

  // Estado de descarga directa en memoria (evita bloqueo en 4.44/4.44 MB de Chrome/Brave)
  readonly descargandoApk = signal<boolean>(false);
  readonly progresoDescarga = signal<number>(0);
  readonly mbDescargados = signal<string>('0.00');
  readonly mbTotales = signal<string>('4.44');
  readonly descargaCompletada = signal<boolean>(false);

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

  async descargarInstalador(): Promise<void> {
    if (this.descargandoApk()) return;

    const endpointBackend = `${environment.apiUrl}/parametros/descargar-apk?v=${this.infoActualizacion()?.version || '1.2.0'}&t=${Date.now()}`;
    const fallbackUrl =
      this.infoActualizacion()?.apk_url ||
      'https://github.com/Cruzjoseandres/TuAutoBo/releases/download/latest/TuAuto.apk';

    // Si estamos dentro de la APK nativa, abrir en el navegador del sistema sin cerrar la pestaña
    if (this.esAppNativa()) {
      window.location.assign(endpointBackend);
      return;
    }

    this.descargandoApk.set(true);
    this.progresoDescarga.set(0);
    this.mbDescargados.set('0.00');
    this.descargaCompletada.set(false);

    try {
      const response = await fetch(endpointBackend);
      if (!response.ok || !response.body) {
        throw new Error('Fallback a descarga directa');
      }

      const contentLength = Number(response.headers.get('Content-Length')) || 4439733;
      this.mbTotales.set((contentLength / (1024 * 1024)).toFixed(2));

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedLength += value.length;
          this.mbDescargados.set((receivedLength / (1024 * 1024)).toFixed(2));
          this.progresoDescarga.set(Math.min(100, Math.round((receivedLength / contentLength) * 100)));
        }
      }

      const blob = new Blob(chunks as BlobPart[], { type: 'application/vnd.android.package-archive' });
      const blobUrl = URL.createObjectURL(blob);
      const versionStr = this.infoActualizacion()?.version || this.VERSION_ACTUAL || '1.2.0';

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `TuAuto-v${versionStr}.apk`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      this.progresoDescarga.set(100);
      this.descargaCompletada.set(true);
      this.descargandoApk.set(false);
    } catch {
      this.descargandoApk.set(false);
      window.location.assign(fallbackUrl);
    }
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
