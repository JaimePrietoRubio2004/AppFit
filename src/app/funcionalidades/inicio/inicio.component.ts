import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonProgressBar,
  ViewWillEnter,
} from '@ionic/angular';
import { ObjetivoPerfil } from '../../nucleo/servicios/objetivo-perfil';
import { ObjetivoCalculado } from '../../nucleo/servicios/calculo-objetivo';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import { REGISTRO_CONSUMO_REPOSITORY } from '../../nucleo/repositorios/registro-consumo.repository';
import { fechaLocal } from '../../nucleo/utilidades/fecha';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { InsertarComida } from '../../nucleo/servicios/insertar-comida';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss'],
  imports: [
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    RouterLink,
    DecimalPipe,
    IonProgressBar,
  ],
})
export class InicioComponent implements OnInit, ViewWillEnter {
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly registroConsumoRepository = inject(
    REGISTRO_CONSUMO_REPOSITORY,
  );
  private readonly objetivoPerfil = inject(ObjetivoPerfil);
  private readonly router = inject(Router);
  private readonly insertarComida = inject(InsertarComida);

  constructor() {
    this.router.events
      .pipe(
        filter(
          (evento) =>
            evento instanceof NavigationEnd &&
            evento.urlAfterRedirects === '/inicio',
        ),
        takeUntilDestroyed(),
      )
      .subscribe(() => void this.cargar());
  }

  protected readonly objetivo = signal<ObjetivoCalculado | null>(null);
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

  protected readonly fraccionKcal = computed(() => {
    const objetivo = this.objetivo();
    return objetivo ? Math.min(this.totalKcal() / objetivo.kcalObjetivo, 1) : 0;
  });

  private async cargar() {
    const actual = await this.perfilRepository.obtenerUltimoUsado();
    if (!actual) {
      return;
    }
    this.textoPerfil.set(`${actual.nombre}`);
    this.objetivo.set(await this.objetivoPerfil.obtener(actual));

    const hoy = fechaLocal();
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

  protected nuevaPlantilla(): void {
    this.insertarComida.proponerPlantillaNueva();
    this.router.navigate(['/insertar-comida']);
  }
}
