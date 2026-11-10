import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { VersionCheckService } from './services/version-check.service';
import { NavigationContextService } from './services/navigation-context.service';
import { ToastComponent } from './components/shared/toast.component';
import { UbicacionBarComponent } from './components/shared/ubicacion-bar.component';
import { UbicacionModalComponent } from './components/shared/ubicacion-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    ToastComponent,
    UbicacionBarComponent,
    UbicacionModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly versionService = inject(VersionCheckService);
  protected readonly navContext = inject(NavigationContextService);
}
