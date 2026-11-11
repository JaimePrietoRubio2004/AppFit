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
  IonIcon,
  ViewWillEnter,
  AlertController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';
import { ObjetivoPerfil } from '../../nucleo/servicios/objetivo-perfil';
import { ObjetivoCalculado } from '../../nucleo/servicios/calculo-objetivo';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import { REGISTRO_CONSUMO_REPOSITORY } from '../../nucleo/repositorios/registro-consumo.repository';
import { fechaLocal } from '../../nucleo/utilidades/fecha';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { InsertarComida } from '../../nucleo/servicios/insertar-comida';
import { ALIMENTO_REPOSITORY } from '../../nucleo/repositorios/alimento.repository';
import { RegistroConsumo } from '../../nucleo/modelos/registro-consumo.model';
import {
  GrupoComida,
  agruparPorComida,
  descripcionCantidad,
  etiquetaComida,
} from '../../nucleo/utilidades/comidas';

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
    IonIcon,
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
  private readonly alimentoRepository = inject(ALIMENTO_REPOSITORY);
  private readonly alertController = inject(AlertController);

  constructor() {
    addIcons({ trashOutline });
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
  protected readonly inicialPerfil = signal('');
  protected readonly colorPerfil = signal('');
  protected readonly totalKcal = signal(0);
  protected readonly totalProteina = signal(0);
  protected readonly totalGrasa = signal(0);
  protected readonly totalCarbohidrato = signal(0);
  protected readonly totalKcalAlcohol = signal(0);
  protected readonly registrosHoy = signal<RegistroConsumo[]>([]);
  protected readonly nombresAlimento = signal<Record<number, string>>({});
  protected readonly grupos = computed(() =>
    agruparPorComida(this.registrosHoy()),
  );
  protected readonly etiquetaComida = etiquetaComida;
  protected readonly descripcionCantidad = descripcionCantidad;

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

  protected readonly macros = computed(() => {
    const objetivo = this.objetivo();
    if (!objetivo) {
      return [];
    }
    return [
      {
        clave: 'proteina',
        nombre: 'Proteína',
        total: this.totalProteina(),
        objetivo: objetivo.proteinaG,
      },
      {
        clave: 'grasa',
        nombre: 'Grasa',
        total: this.totalGrasa(),
        objetivo: objetivo.grasaG,
      },
      {
        clave: 'carbohidrato',
        nombre: 'Hidratos',
        total: this.totalCarbohidrato(),
        objetivo: objetivo.carbohidratoG,
      },
    ];
  });

  private async cargar() {
    const actual = await this.perfilRepository.obtenerUltimoUsado();
    if (!actual) {
      return;
    }
    this.inicialPerfil.set(actual.nombre.charAt(0).toUpperCase());
    this.colorPerfil.set(actual.colorAvatar);
    this.objetivo.set(await this.objetivoPerfil.obtener(actual));

    const hoy = fechaLocal();
    const registros = await this.registroConsumoRepository.obtenerPorDia(
      actual.id,
      hoy,
    );
    await this.cargarNombres(registros);
    this.registrosHoy.set(registros);

    this.totalKcal.set(registros.reduce((suma, r) => suma + r.kcal, 0));
    this.totalKcalAlcohol.set(
      registros.reduce((suma, r) => suma + r.kcalAlcohol, 0),
    );
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

  protected fraccion(total: number, objetivo: number): number {
    return objetivo > 0 ? Math.min(total / objetivo, 1) : 0;
  }

  protected kcalDe(grupo: GrupoComida): number {
    return grupo.registros.reduce((suma, r) => suma + r.kcal, 0);
  }

  protected async pedirEliminar(registro: RegistroConsumo): Promise<void> {
    const nombre = this.nombresAlimento()[registro.alimentoId];
    const alerta = await this.alertController.create({
      header: 'Eliminar registro',
      message: `Se borrará "${nombre}" (${descripcionCantidad(registro)}) de hoy.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.eliminar(registro.id),
        },
      ],
    });
    await alerta.present();
  }

  private async eliminar(id: number): Promise<void> {
    await this.registroConsumoRepository.eliminar(id);
    await this.cargar();
  }

  private async cargarNombres(registros: RegistroConsumo[]): Promise<void> {
    const nombres = { ...this.nombresAlimento() };
    for (const id of new Set(registros.map((r) => r.alimentoId))) {
      if (nombres[id] === undefined) {
        const alimento = await this.alimentoRepository.obtenerPorId(id);
        nombres[id] = alimento?.nombre ?? 'Alimento desconocido';
      }
    }
    this.nombresAlimento.set(nombres);
  }
}
