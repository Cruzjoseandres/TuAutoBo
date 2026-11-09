import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService, VersionCheckService } from '../../services';

@Component({
  selector: 'app-descargar-app',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './descargar-app.component.html',
})
export class DescargarAppComponent {
  readonly theme = inject(ThemeService);
  readonly versionService = inject(VersionCheckService);

  readonly urlApk = 'https://github.com/Cruzjoseandres/TuAutoBo/releases/latest/download/TuAuto.apk';

  descargar(): void {
    window.open(this.urlApk, '_blank');
  }
}
