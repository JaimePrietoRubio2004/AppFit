import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { CatalogoSemilla } from './nucleo/servicios/catalogo-semilla';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly catalogoSemilla = inject(CatalogoSemilla);
  constructor() {
    this.catalogoSemilla.cargarSiHaceFalta();
  }
}
