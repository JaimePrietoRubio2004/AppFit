import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  AlertController,
  ViewWillEnter,
} from '@ionic/angular';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import { Perfil } from '../../nucleo/modelos/perfil.model';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.scss'],
  imports: [IonContent, IonTitle, IonHeader, IonButton, IonToolbar],
})
export class AjustesComponent implements OnInit, ViewWillEnter {
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly alertController = inject(AlertController);
  private readonly router = inject(Router);

  protected readonly perfilActual = signal<Perfil | null>(null);
  protected readonly puedeEliminar = signal(true);

  async ionViewWillEnter(): Promise<void> {
    await this.cargar();
  }

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.perfilActual.set(await this.perfilRepository.obtenerUltimoUsado());
    this.puedeEliminar.set((await this.perfilRepository.listar()).length > 1);
  }

  irASeleccionPerfil(): void {
    this.router.navigate(['/seleccion-perfil']);
  }

  async eliminarPerfil(): Promise<void> {
    const actual = this.perfilActual();
    if (!actual || !this.puedeEliminar()) {
      return;
    }
    const alerta = await this.alertController.create({
      header: 'Eliminar perfil',
      message: `Se borrarán los registros, plantillas y datos de uso de "${actual.nombre}". El catálogo de alimentos no se ve afectado.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.confirmarEliminacion(actual.id),
        },
      ],
    });
    await alerta.present();
  }

  private async confirmarEliminacion(id: number): Promise<void> {
    await this.perfilRepository.eliminar(id);
    const restantes = await this.perfilRepository.listar();
    if (restantes.length === 1) {
      await this.perfilRepository.marcarComoUltimoUsado(restantes[0].id);
      this.router.navigate(['/inicio']);
    } else {
      this.router.navigate(['/seleccion-perfil']);
    }
  }
}
