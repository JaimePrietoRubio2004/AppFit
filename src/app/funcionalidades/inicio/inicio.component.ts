import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  ViewWillEnter,
  IonButtons,
} from '@ionic/angular';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import { REGISTRO_CONSUMO_REPOSITORY } from '../../nucleo/repositorios/registro-consumo.repository';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss'],
  imports: [
    IonButtons,
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    RouterLink,
    DecimalPipe,
  ],
})
export class InicioComponent implements OnInit, ViewWillEnter {
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly registroConsumoRepository = inject(
    REGISTRO_CONSUMO_REPOSITORY,
  );

  protected readonly textoPerfil = signal('cargando...');
  protected readonly totalKcal = signal(0);
  protected readonly totalProteina = signal(0);
  protected readonly totalGrasa = signal(0);
  protected readonly totalCarbohidrato = signal(0);

  async ionViewWillEnter(): Promise<void> {
    await this.cargar();
  }

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  private async cargar() {
    const actual = await this.perfilRepository.obtenerUltimoUsado();
    if (!actual) {
      return;
    }
    this.textoPerfil.set(`${actual.nombre} (id ${actual.id})`);

    const hoy = new Date().toISOString().slice(0, 10);
    const registros = await this.registroConsumoRepository.obtenerPorDia(
      actual.id,
      hoy,
    );

    this.totalKcal.set(registros.reduce((suma, r) => suma + r.kcal, 0));
    this.totalProteina.set(
      registros.reduce((suma, r) => suma + r.proteinaG, 0),
    );
    this.totalGrasa.set(registros.reduce((suma, r) => suma + r.grasaG, 0));
    this.totalCarbohidrato.set(
      registros.reduce((suma, r) => suma + r.carboHidratoG, 0),
    );
  }
}
