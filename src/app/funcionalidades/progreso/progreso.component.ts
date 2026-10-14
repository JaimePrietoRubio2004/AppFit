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
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';

const DIAS_SERIE = 28;

function colorCss(variable: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
}
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
    BaseChartDirective,
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
  protected readonly opciones: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: colorCss('--ion-text-color') } },
    },
    scales: {
      x: { ticks: { color: colorCss('--ion-text-color'), maxTicksLimit: 7 } },
      y: { ticks: { color: colorCss('--ion-text-color') } },
    },
  };

  private readonly etiquetas = computed(() =>
    this.serie().map((p) => `${p.fecha.slice(8, 10)}/${p.fecha.slice(5, 7)}`),
  );

  protected readonly datosKcal = computed<ChartConfiguration<'line'>['data']>(
    () => {
      const objetivo = this.objetivo();
      const conjuntos: ChartConfiguration<'line'>['data']['datasets'] = [
        {
          label: 'Media 7 días (kcal)',
          data: this.serie().map((p) => p.kcal),
          borderColor: colorCss('--ion-color-primary'),
          pointRadius: 3,
          tension: 0.3,
        },
      ];
      if (objetivo) {
        conjuntos.push({
          label: 'Objetivo (kcal)',
          data: this.serie().map(() => objetivo.kcalObjetivo),
          borderColor: colorCss('--ion-color-medium'),
          borderDash: [6, 4],
          pointRadius: 0,
        });
      }
      return { labels: this.etiquetas(), datasets: conjuntos };
    },
  );

  protected readonly datosPeso = computed<ChartConfiguration<'line'>['data']>(
    () => ({
      labels: this.etiquetas(),
      datasets: [
        {
          label: 'Peso, media 7 días (kg)',
          data: this.serie().map((p) => p.pesoKg),
          borderColor: colorCss('--ion-color-primary'),
          pointRadius: 3,
          tension: 0.3,
        },
      ],
    }),
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
