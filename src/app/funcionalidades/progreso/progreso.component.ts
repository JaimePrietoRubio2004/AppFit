import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  ViewWillEnter,
} from '@ionic/angular';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import { REGISTRO_PESO_REPOSITORY } from '../../nucleo/repositorios/registro-peso.repository';
import { ObjetivoPerfil } from '../../nucleo/servicios/objetivo-perfil';
import { ObjetivoCalculado } from '../../nucleo/servicios/calculo-objetivo';
import { Estadisticas, PuntoSerie } from '../../nucleo/servicios/estadisticas';
import { fechaLocal } from '../../nucleo/utilidades/fecha';

const DIAS_SERIE = 28;

@Component({
  selector: 'app-progreso',
  templateUrl: './progreso.component.html',
  styleUrls: ['./progreso.component.scss'],
  imports: [
    DecimalPipe,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
  ],
})
export class ProgresoComponent implements OnInit, ViewWillEnter {
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly registroPesoRepository = inject(REGISTRO_PESO_REPOSITORY);
  private readonly objetivoPerfil = inject(ObjetivoPerfil);
  private readonly estadisticas = inject(Estadisticas);

  protected readonly objetivo = signal<ObjetivoCalculado | null>(null);
  protected readonly serie = signal<PuntoSerie[]>([]);
  protected readonly pesoHoyTexto = signal('');
  protected readonly mensaje = signal<string | null>(null);

  protected readonly resumen = computed(() => this.serie().at(-1) ?? null);
  protected readonly pesoValido = computed(
    () => Number(this.pesoHoyTexto()) > 0,
  );

  async ionViewWillEnter(): Promise<void> {
    await this.cargar();
  }

  async ngOnInit() {
    await this.cargar();
  }

  protected aTexto(valor: unknown): string {
    return valor === null || valor === undefined ? '' : String(valor);
  }

  protected async cargar(): Promise<void> {
    const perfil = await this.perfilRepository.obtenerUltimoUsado();
    if (!perfil) {
      return;
    }
    this.objetivo.set(await this.objetivoPerfil.obtener(perfil));
    this.serie.set(
      await this.estadisticas.serie(perfil.id, fechaLocal(), DIAS_SERIE),
    );
  }
  async guardarPeso(): Promise<void> {
    if (!this.pesoValido()) {
      return;
    }
    this.mensaje.set(null);
    try {
      const perfil = await this.perfilRepository.obtenerUltimoUsado();
      if (!perfil) {
        return;
      }
      const pesoKg = Number(this.pesoHoyTexto());
      const hoy = fechaLocal();
      const existente = await this.registroPesoRepository.obtenerPorFecha(
        perfil.id,
        hoy,
      );
      if (existente) {
        await this.registroPesoRepository.actualizar({ ...existente, pesoKg });
      } else {
        await this.registroPesoRepository.crear({
          perfilId: perfil.id,
          fecha: hoy,
          pesoKg,
        });
      }
      this.pesoHoyTexto.set('');
      await this.cargar();
    } catch (error) {
      this.mensaje.set(`Error al guardar: ${error}`);
    }
  }
}
