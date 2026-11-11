import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { CatalogoSemilla } from './nucleo/servicios/catalogo-semilla';
import { Apariencia } from './nucleo/servicios/apariencia';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly catalogoSemilla = inject(CatalogoSemilla);
  private readonly apariencia = inject(Apariencia);
  constructor() {
    this.catalogoSemilla.cargarSiHaceFalta();
    void this.apariencia.iniciar();
  }
}
