import { Component, OnInit, inject, signal } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class InicioComponent implements OnInit {
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);

  protected readonly textoPerfil = signal('cargando...');

  constructor() {}

  async ngOnInit() {
    let actual = await this.perfilRepository.obtenerUltimoUsado();

    if (!actual) {
      actual = await this.perfilRepository.crear({
        nombre: 'Perfil de prueba',
        colorAvatar: '#0F766E',
        esUltimoUsado: true,
        sexo: 'hombre',
        fechaNacimiento: '2000-01-01',
        alturaCm: 175,
        nivelActividad: 'moderado',
        objetivo: 'recomposicion',
        ritmoSemanalKg: 0,
        fechaAlta: new Date().toISOString(),
      });
    }
    this.textoPerfil.set(`${actual.nombre} (id ${actual.id})`);
  }
}
