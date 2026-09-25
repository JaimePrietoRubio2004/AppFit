import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  ViewWillEnter,
} from '@ionic/angular';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import { Perfil } from '../../nucleo/modelos/perfil.model';
@Component({
  selector: 'app-seleccion-perfil',
  templateUrl: './seleccion-perfil.component.html',
  styleUrls: ['./seleccion-perfil.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
  ],
})
export class SeleccionPerfilComponent implements OnInit, ViewWillEnter {
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly router = inject(Router);

  protected readonly perfiles = signal<Perfil[]>([]);

  async ionViewWillEnter(): Promise<void> {
    await this.cargar();
  }

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  private async cargar(): Promise<void> {
    this.perfiles.set(await this.perfilRepository.listar());
  }

  async elegir(perfil: Perfil): Promise<void> {
    await this.perfilRepository.marcarComoUltimoUsado(perfil.id);
    this.router.navigate(['/inicio']);
  }

  nuevoPerfil(): void {
    this.router.navigate(['/configuracion-inicial']);
  }
}
