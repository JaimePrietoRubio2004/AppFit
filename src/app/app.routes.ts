import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'inicio',
    loadComponent: () =>
      import('./funcionalidades/inicio/inicio.component').then(
        (m) => m.InicioComponent,
      ),
  },
  {
    path: 'anadir-alimento',
    loadComponent: () =>
      import('./funcionalidades/anadir-alimento/anadir-alimento.component').then(
        (m) => m.AnadirAlimentoComponent,
      ),
  },
  {
    path: 'detalle-alimento/:id',
    loadComponent: () =>
      import('./funcionalidades/detalle-alimento/detalle-alimento.component').then(
        (m) => m.DetalleAlimentoComponent,
      ),
  },
  {
    path: 'configuracion-inicial',
    loadComponent: () =>
      import('./funcionalidades/configuracion-inicial/configuracion-inicial.component').then(
        (m) => m.ConfiguracionInicialComponent,
      ),
  },
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
];
