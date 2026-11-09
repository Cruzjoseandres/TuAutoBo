import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { CompradorComponent } from './components/comprador/comprador.component';
import { DetalleRepuestoComponent } from './components/comprador/detalle-repuesto/detalle-repuesto.component';
import { CheckoutComponent } from './components/comprador/checkout/checkout.component';
import { VendedorComponent } from './components/vendedor/vendedor.component';
import { CrearRepuestoComponent } from './components/vendedor/nuevo-repuesto/crear-repuesto.component';
import { RepartidorComponent } from './components/repartidor/repartidor.component';
import { AdminComponent } from './components/admin/admin.component';
import { DescargarAppComponent } from './components/descargar-app/descargar-app.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'comprador',
    pathMatch: 'full',
    redirectTo: 'comprador/catalogo',
  },
  {
    path: 'comprador/repuesto/:id',
    component: DetalleRepuestoComponent,
    canActivate: [authGuard, roleGuard],
    data: { rol: 'COMPRADOR' },
  },
  {
    path: 'comprador/checkout/:id',
    component: CheckoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { rol: 'COMPRADOR' },
  },
  {
    path: 'comprador/:tab',
    component: CompradorComponent,
    canActivate: [authGuard, roleGuard],
    data: { rol: 'COMPRADOR' },
  },
  {
    path: 'vendedor',
    pathMatch: 'full',
    redirectTo: 'vendedor/inventario',
  },
  {
    path: 'vendedor/nuevo-repuesto',
    component: CrearRepuestoComponent,
    canActivate: [authGuard, roleGuard],
    data: { rol: 'VENDEDOR' },
  },
  {
    path: 'vendedor/editar-repuesto/:id',
    component: CrearRepuestoComponent,
    canActivate: [authGuard, roleGuard],
    data: { rol: 'VENDEDOR' },
  },
  {
    path: 'vendedor/:tab',
    component: VendedorComponent,
    canActivate: [authGuard, roleGuard],
    data: { rol: 'VENDEDOR' },
  },
  {
    path: 'repartidor',
    pathMatch: 'full',
    redirectTo: 'repartidor/disponibles',
  },
  {
    path: 'repartidor/:tab',
    component: RepartidorComponent,
    canActivate: [authGuard, roleGuard],
    data: { rol: 'REPARTIDOR' },
  },
  {
    path: 'admin',
    pathMatch: 'full',
    redirectTo: 'admin/resumen',
  },
  {
    path: 'admin/:tab',
    component: AdminComponent,
    canActivate: [authGuard, roleGuard],
    data: { rol: 'ADMINISTRADOR' },
  },
  {
    path: 'descargar-app',
    component: DescargarAppComponent,
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
