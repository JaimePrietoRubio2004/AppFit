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
import { ToastController } from '@ionic/angular';
import { COPIA_SEGURIDAD_REPOSITORY } from '../../nucleo/repositorios/copia-seguridad.repository';
import { CopiaSeguridad } from '../../nucleo/modelos/copia-seguridad.model';
import { ArchivoCopiaSeguridad } from '../../nucleo/servicios/archivo-copia-seguridad';
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
  private readonly archivoCopia = inject(ArchivoCopiaSeguridad);
  private readonly copiaRepository = inject(COPIA_SEGURIDAD_REPOSITORY);
  private readonly toastController = inject(ToastController);

  protected readonly mensaje = signal<string | null>(null);
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

  async exportarCopia(): Promise<void> {
    this.mensaje.set(null);
    const resultado = await this.archivoCopia.exportar();
    if (resultado.estado === 'error') {
      this.mensaje.set(`No se pudo exportar: ${resultado.mensaje}`);
    }
  }

  async alElegirArchivo(evento: Event): Promise<void> {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0];
    entrada.value = '';
    if (!archivo) {
      return;
    }
    this.mensaje.set(null);
    try {
      const copia = await this.archivoCopia.leer(archivo);
      await this.pedirConfirmacionImportar(copia);
    } catch (error) {
      this.mensaje.set(error instanceof Error ? error.message : `${error}`);
    }
  }

  private async pedirConfirmacionImportar(
    copia: CopiaSeguridad,
  ): Promise<void> {
    const perfiles = copia.tablas['perfil'].length;
    const registros = copia.tablas['registro_consumo'].length;
    const fecha = copia.exportadoEn.slice(0, 10);
    const alerta = await this.alertController.create({
      header: 'Importar copia',
      message: `Copia del ${fecha}: ${perfiles} perfil(es) y ${registros} registros de consumo. Se sustituirán TODOS los datos actuales por los de la copia y no se puede deshacer. Si dudas, exporta antes una copia de lo actual.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Importar',
          role: 'destructive',
          handler: () => this.importarCopia(copia),
        },
      ],
    });
    await alerta.present();
  }

  private async importarCopia(copia: CopiaSeguridad): Promise<void> {
    try {
      await this.copiaRepository.importar(copia);
      const aviso = await this.toastController.create({
        message: 'Copia importada.',
        duration: 1500,
      });
      await aviso.present();
      window.location.assign('/');
    } catch (error) {
      this.mensaje.set(
        `No se pudo importar; tus datos no se han modificado. Detalle: ${error}`,
      );
    }
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
