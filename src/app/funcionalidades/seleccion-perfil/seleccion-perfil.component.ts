import { Component, OnInit, inject, signal } from '@angular/core';
import { formatNumber } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, chevronForwardOutline } from 'ionicons/icons';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import { Perfil } from '../../nucleo/modelos/perfil.model';
import { ObjetivoPerfil } from '../../nucleo/servicios/objetivo-perfil';
import { etiquetaObjetivo } from '../../nucleo/utilidades/objetivo';

@Component({
  selector: 'app-seleccion-perfil',
  templateUrl: './seleccion-perfil.component.html',
  styleUrls: ['./seleccion-perfil.component.scss'],
  imports: [IonContent, IonButton, IonIcon],
})
export class SeleccionPerfilComponent implements OnInit, ViewWillEnter {
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly router = inject(Router);
  private readonly objetivoPerfil = inject(ObjetivoPerfil);

  protected readonly perfiles = signal<Perfil[]>([]);
  private readonly kcalObjetivo = signal<Record<number, number | null>>({});

  constructor() {
    addIcons({ addOutline, chevronForwardOutline });
  }

  protected resumen(perfil: Perfil): string {
    const kcal = this.kcalObjetivo()[perfil.id];
    const objetivo = etiquetaObjetivo(perfil.objetivo);
    return kcal
      ? `${objetivo} · ${formatNumber(kcal, 'es-ES', '1.0-0')} kcal`
      : objetivo;
  }

  async ionViewWillEnter(): Promise<void> {
    await this.cargar();
  }

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  private async cargar(): Promise<void> {
    const perfiles = await this.perfilRepository.listar();
    const kcal: Record<number, number | null> = {};
    for (const perfil of perfiles) {
      kcal[perfil.id] =
        (await this.objetivoPerfil.obtener(perfil))?.kcalObjetivo ?? null;
    }
    this.kcalObjetivo.set(kcal);
    this.perfiles.set(perfiles);
  }

  async elegir(perfil: Perfil): Promise<void> {
    await this.perfilRepository.marcarComoUltimoUsado(perfil.id);
    this.router.navigate(['/inicio']);
  }

  nuevoPerfil(): void {
    this.router.navigate(['/configuracion-inicial']);
  }
}
