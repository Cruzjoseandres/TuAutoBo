import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  isDarkMode = signal<boolean>(false);

  constructor() {
    const saved = localStorage.getItem('tuauto_theme');
    if (saved) {
      this.isDarkMode.set(saved === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode.set(prefersDark);
    }

    effect(() => {
      const dark = this.isDarkMode();
      if (dark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('tuauto_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('tuauto_theme', 'light');
      }
    });
  }

  toggleTheme() {
    this.isDarkMode.set(!this.isDarkMode());
  }
}
