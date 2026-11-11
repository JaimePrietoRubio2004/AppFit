import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput,
  ViewWillEnter,
} from '@ionic/angular';
import { Apariencia } from '../../nucleo/servicios/apariencia';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import { REGISTRO_PESO_REPOSITORY } from '../../nucleo/repositorios/registro-peso.repository';
import { ObjetivoPerfil } from '../../nucleo/servicios/objetivo-perfil';
import { ObjetivoCalculado } from '../../nucleo/servicios/calculo-objetivo';
import { Estadisticas, PuntoSerie } from '../../nucleo/servicios/estadisticas';
import { fechaLocal } from '../../nucleo/utilidades/fecha';
import { BaseChartDirective } from 'ng2-charts';
import { lecturaEstimacion } from '../../nucleo/utilidades/estimacion';
import type { ChartConfiguration } from 'chart.js';

const DIAS_SERIE = 28;
const PUNTOS_MINIMOS_PARA_LINEA = 8;

// Con pocas lecturas una línea no se ve: se dibujan los puntos
function radioPuntos(datos: (number | null)[]): number {
  const lecturas = datos.filter((d) => d !== null).length;
  return lecturas < PUNTOS_MINIMOS_PARA_LINEA ? 3 : 0;
}

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
    IonInput,
    BaseChartDirective,
  ],
})
export class ProgresoComponent implements OnInit, ViewWillEnter {
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly registroPesoRepository = inject(REGISTRO_PESO_REPOSITORY);
  private readonly objetivoPerfil = inject(ObjetivoPerfil);
  private readonly estadisticas = inject(Estadisticas);
  private readonly apariencia = inject(Apariencia);
  private readonly graficas = viewChildren(BaseChartDirective);

  protected readonly objetivo = signal<ObjetivoCalculado | null>(null);
  protected readonly serie = signal<PuntoSerie[]>([]);
  protected readonly pesoHoyTexto = signal('');
  protected readonly mensaje = signal<string | null>(null);

  protected readonly resumen = computed(() => this.serie().at(-1) ?? null);
  protected readonly lectura = computed(() => {
    const r = this.resumen();
    if (!r || r.porcentajeEstimado === null) {
      return null;
    }
    return lecturaEstimacion(r.porcentajeEstimado);
  });
  protected readonly pesoValido = computed(
    () => Number(this.pesoHoyTexto()) > 0,
  );
  protected readonly macros = computed(() => {
    const r = this.resumen();
    const o = this.objetivo();
    if (!r) {
      return [];
    }
    return [
      {
        clave: 'proteina',
        nombre: 'Proteína',
        total: r.proteinaG ?? 0,
        objetivo: o?.proteinaG ?? null,
      },
      {
        clave: 'grasa',
        nombre: 'Grasa',
        total: r.grasaG ?? 0,
        objetivo: o?.grasaG ?? null,
      },
      {
        clave: 'carbohidrato',
        nombre: 'Hidratos',
        total: r.carbohidratoG ?? 0,
        objetivo: o?.carbohidratoG ?? null,
      },
    ];
  });

  protected readonly opciones = computed<ChartConfiguration<'line'>['options']>(
    () => {
      this.apariencia.oscuro();
      const fuente = { family: colorCss('--ion-font-family'), size: 11 };
      const texto = colorCss('--app-texto-secundario');
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: texto, font: fuente, maxTicksLimit: 5 },
          },
          y: {
            grid: { color: colorCss('--app-borde') },
            border: { display: false },
            ticks: { color: texto, font: fuente, maxTicksLimit: 3 },
          },
        },
      };
    },
  );

  private readonly etiquetas = computed(() =>
    this.serie().map((p) => `${p.fecha.slice(8, 10)}/${p.fecha.slice(5, 7)}`),
  );

  protected readonly datosKcal = computed<ChartConfiguration<'line'>['data']>(
    () => {
      this.apariencia.oscuro();
      const objetivo = this.objetivo();
      const conjuntos: ChartConfiguration<'line'>['data']['datasets'] = [
        {
          label: 'Media 7 días (kcal)',
          data: this.serie().map((p) => p.kcal),
          borderColor: colorCss('--app-primario'),
          backgroundColor: colorCss('--app-primario'),
          borderWidth: 2.5,
          pointRadius: radioPuntos(this.serie().map((p) => p.kcal)),
          pointHitRadius: 12,
          tension: 0.3,
        },
      ];
      if (objetivo) {
        conjuntos.push({
          label: 'Objetivo (kcal)',
          data: this.serie().map(() => objetivo.kcalObjetivo),
          borderColor: colorCss('--app-texto-secundario'),
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
        });
      }
      return { labels: this.etiquetas(), datasets: conjuntos };
    },
  );

  protected readonly datosPeso = computed<ChartConfiguration<'line'>['data']>(
    () => {
      this.apariencia.oscuro();
      return {
        labels: this.etiquetas(),
        datasets: [
          {
            label: 'Peso, media 7 días (kg)',
            data: this.serie().map((p) => p.pesoKg),
            borderColor: colorCss('--app-macro-proteina'),
            backgroundColor: colorCss('--app-macro-proteina'),
            borderWidth: 2.5,
            pointRadius: radioPuntos(this.serie().map((p) => p.pesoKg)),
            pointHitRadius: 12,
            tension: 0.3,
          },
        ],
      };
    },
  );

  async ionViewWillEnter(): Promise<void> {
    await this.cargar();
  }

  async ngOnInit() {
    await this.cargar();
  }

  protected fraccion(total: number, objetivo: number): number {
    return objetivo > 0 ? Math.min(total / objetivo, 1) : 0;
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
    // Si la página se montó oculta, Chart.js se queda sin tamaño: recalcular
    setTimeout(() => this.graficas().forEach((g) => g.chart?.resize()));
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
