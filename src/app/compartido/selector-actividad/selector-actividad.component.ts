import { Component, computed, model, signal } from '@angular/core';
import { IonContent, IonIcon, IonModal } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronDownOutline } from 'ionicons/icons';
import { NivelActividad } from '../../nucleo/modelos/perfil.model';
import { NIVELES_ACTIVIDAD } from '../../nucleo/utilidades/nivel-actividad';

@Component({
  selector: 'app-selector-actividad',
  templateUrl: './selector-actividad.component.html',
  styleUrls: ['./selector-actividad.component.scss'],
  imports: [IonContent, IonIcon, IonModal],
})
export class SelectorActividadComponent {
  readonly valor = model<NivelActividad>('moderado');

  protected readonly niveles = NIVELES_ACTIVIDAD;
  protected readonly abierto = signal(false);
  protected readonly actual = computed(
    () => this.niveles.find((n) => n.valor === this.valor()) ?? this.niveles[2],
  );

  constructor() {
    addIcons({ chevronDownOutline });
  }

  protected elegir(valor: NivelActividad): void {
    this.valor.set(valor);
    this.abierto.set(false);
  }
}
