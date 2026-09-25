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
import { ALIMENTO_REPOSITORY } from './app/nucleo/repositorios/alimento.repository';
import { AlimentoSqlite } from './app/nucleo/repositorios/alimento-sqlite.repository';
import { REGISTRO_CONSUMO_REPOSITORY } from './app/nucleo/repositorios/registro-consumo.repository';
import { RegistroConsumoSqlite } from './app/nucleo/repositorios/registro-consumo-sqlite.repository';
import { inject, Inject, provideAppInitializer } from '@angular/core';
import { CatalogoSemilla } from './app/nucleo/servicios/catalogo-semilla';
import { REGISTRO_PESO_REPOSITORY } from './app/nucleo/repositorios/registro-peso.repository';
import { RegistroPesoSqlite } from './app/nucleo/repositorios/registro-peso-sqlite.repository';

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
    { provide: ALIMENTO_REPOSITORY, useClass: AlimentoSqlite },
    { provide: REGISTRO_CONSUMO_REPOSITORY, useClass: RegistroConsumoSqlite },
    { provide: REGISTRO_PESO_REPOSITORY, useClass: RegistroPesoSqlite },
  ],
});
