import { Injectable, inject, signal, effect } from '@angular/core';
import { LocalDbService } from './local-db.service';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly localDb = inject(LocalDbService);
  isDarkMode = signal<boolean>(false);

  constructor() {
    const saved = localStorage.getItem('tuauto_theme');
    if (saved) {
      this.isDarkMode.set(saved === 'dark');
    } else {
      const prefersDark =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode.set(prefersDark);
    }

    // Hidratar desde IndexedDB si localStorage fue limpiado
    void this.localDb.obtenerPreferencia<'dark' | 'light'>('tuauto_theme').then((pref) => {
      if (pref) {
        this.isDarkMode.set(pref === 'dark');
      }
    });

    effect(() => {
      const dark = this.isDarkMode();
      const valor = dark ? 'dark' : 'light';
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      try {
        localStorage.setItem('tuauto_theme', valor);
      } catch {}
      void this.localDb.guardarPreferencia('tuauto_theme', valor);

      // Sincronizar color de barra de estado nativa y navegador móvil
      const metaTheme = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement | null;
      if (metaTheme) {
        metaTheme.content = dark ? '#000000' : '#F5F5F7';
      }
    });
  }

  toggleTheme() {
    this.isDarkMode.set(!this.isDarkMode());
  }
}
