import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, VersionCheckService, NavigationContextService } from '../../services';

@Component({
  selector: 'app-descargar-app',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './descargar-app.component.html',
})
export class DescargarAppComponent implements OnInit {
  readonly theme = inject(ThemeService);
  readonly versionService = inject(VersionCheckService);
  readonly navContext = inject(NavigationContextService);

  readonly urlApk = 'https://github.com/Cruzjoseandres/TuAutoBo/releases/latest/download/TuAuto.apk';

  ngOnInit(): void {
    // Si ya se está dentro del APK nativo instalado, no mostrar la página de descarga
    if (this.versionService.esAppNativa()) {
      this.navContext.volver();
    }
  }

  volver(): void {
    this.navContext.volver();
  }

  descargar(): void {
    window.open(this.urlApk, '_blank');
  }
}
