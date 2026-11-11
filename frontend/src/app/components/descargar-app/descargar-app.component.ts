import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, VersionCheckService, NavigationContextService } from '../../services';
import { environment } from '../../../environments/environment';

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

  readonly urlApkDirecto = `${environment.apiUrl}/parametros/descargar-apk?v=1.2.0`;
  readonly urlApkGithub = 'https://github.com/Cruzjoseandres/TuAutoBo/releases/download/latest/TuAuto.apk';

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
    this.versionService.descargarInstalador();
  }
}
