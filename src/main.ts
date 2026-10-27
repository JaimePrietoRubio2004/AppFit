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
import { REGISTRO_PESO_REPOSITORY } from './app/nucleo/repositorios/registro-peso.repository';
import { RegistroPesoSqlite } from './app/nucleo/repositorios/registro-peso-sqlite.repository';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { PERFIL_ALIMENTO_REPOSITORY } from './app/nucleo/repositorios/perfil-alimento.repository';
import { PerfilAlimentoSqlite } from './app/nucleo/repositorios/perfil-alimento-sqlite.repository';
import { PLANTILLA_COMIDA_REPOSITORY } from './app/nucleo/repositorios/plantilla-comida.repository';
import { PlantillaComidaSqlite } from './app/nucleo/repositorios/plantilla-comida-sqlite.repository';
import { COPIA_SEGURIDAD_REPOSITORY } from './app/nucleo/repositorios/copia-seguridad.repository';
import { CopiaSeguridadSqlite } from './app/nucleo/repositorios/copia-seguridad-sqlite.repository';

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
    provideCharts(withDefaultRegisterables()),
    { provide: PERFIL_REPOSITORY, useClass: PerfilSqlite },
    { provide: ALIMENTO_REPOSITORY, useClass: AlimentoSqlite },
    { provide: REGISTRO_CONSUMO_REPOSITORY, useClass: RegistroConsumoSqlite },
    { provide: REGISTRO_PESO_REPOSITORY, useClass: RegistroPesoSqlite },
    { provide: PERFIL_ALIMENTO_REPOSITORY, useClass: PerfilAlimentoSqlite },
    { provide: PLANTILLA_COMIDA_REPOSITORY, useClass: PlantillaComidaSqlite },
    { provide: COPIA_SEGURIDAD_REPOSITORY, useClass: CopiaSeguridadSqlite },
  ],
});
