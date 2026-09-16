import { PERFIL_REPOSITORY } from './app/nucleo/repositorios/perfil.repository';
import { PerfilSqlite } from './app/nucleo/repositorios/perfil-sqlite.repository';
import { bootstrapApplication } from '@angular/platform-browser';
import { defineCustomElements } from 'jeep-sqlite/loader';
import {
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

defineCustomElements(window);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withComponentInputBinding(),
    ),
    { provide: PERFIL_REPOSITORY, useClass: PerfilSqlite },
  ],
});
