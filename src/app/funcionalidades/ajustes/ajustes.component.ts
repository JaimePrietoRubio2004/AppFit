import { Component, OnInit, inject, signal } from '@angular/core';
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
import { ToastController } from '@ionic/angular';
import { COPIA_SEGURIDAD_REPOSITORY } from '../../nucleo/repositorios/copia-seguridad.repository';
import { CopiaSeguridad } from '../../nucleo/modelos/copia-seguridad.model';
import { ArchivoCopiaSeguridad } from '../../nucleo/servicios/archivo-copia-seguridad';
import { NavigationEnd, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ObjetivoPerfil } from '../../nucleo/servicios/objetivo-perfil';
import { ObjetivoCalculado } from '../../nucleo/servicios/calculo-objetivo';
import { ObjetivoCorporal, Perfil } from '../../nucleo/modelos/perfil.model';

const ETIQUETA_OBJETIVO: Record<ObjetivoCorporal, string> = {
  ganar_masa: 'Ganar masa',
  perder_grasa: 'Perder grasa',
  recomposicion: 'Recomposición',
};
@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.scss'],
  imports: [
    IonContent,
    IonTitle,
    IonHeader,
    IonButton,
    IonToolbar,
    DecimalPipe,
  ],
})
export class AjustesComponent implements OnInit, ViewWillEnter {
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly alertController = inject(AlertController);
  private readonly router = inject(Router);
  private readonly archivoCopia = inject(ArchivoCopiaSeguridad);
  private readonly copiaRepository = inject(COPIA_SEGURIDAD_REPOSITORY);
  private readonly toastController = inject(ToastController);
  private readonly objetivoPerfil = inject(ObjetivoPerfil);

  protected readonly objetivoActual = signal<ObjetivoCalculado | null>(null);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly perfilActual = signal<Perfil | null>(null);
  protected readonly puedeEliminar = signal(true);

  constructor() {
    this.router.events
      .pipe(
        filter(
          (evento) =>
            evento instanceof NavigationEnd &&
            evento.urlAfterRedirects === '/ajustes',
        ),
        takeUntilDestroyed(),
      )
      .subscribe(() => void this.cargar());
  }

  protected etiquetaObjetivo(objetivo: ObjetivoCorporal): string {
    return ETIQUETA_OBJETIVO[objetivo];
  }

  async ionViewWillEnter(): Promise<void> {
    await this.cargar();
  }

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    const perfil = await this.perfilRepository.obtenerUltimoUsado();
    this.perfilActual.set(perfil);
    this.objetivoActual.set(
      perfil ? await this.objetivoPerfil.obtener(perfil) : null,
    );
    this.puedeEliminar.set((await this.perfilRepository.listar()).length > 1);
  }

  irASeleccionPerfil(): void {
    this.router.navigate(['/seleccion-perfil']);
  }

  editarPerfil(): void {
    this.router.navigate(['/editar-perfil']);
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
