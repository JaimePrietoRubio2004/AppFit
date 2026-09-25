import { Routes } from '@angular/router';
import { ArranqueGuards } from './nucleo/guardias/arranque.guards';

export const routes: Routes = [
  {
    path: 'inicio',
    canActivate: [ArranqueGuards],
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
    path: 'seleccion-perfil',
    loadComponent: () =>
      import('./funcionalidades/seleccion-perfil/seleccion-perfil.component').then(
        (m) => m.SeleccionPerfilComponent,
      ),
  },
  {
    path: 'ajustes',
    loadComponent: () =>
      import('./funcionalidades/ajustes/ajustes.component').then(
        (m) => m.AjustesComponent,
      ),
  },
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
];
