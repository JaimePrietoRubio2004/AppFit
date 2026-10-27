import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  WritableSignal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonSegment,
  IonSegmentButton,
  ViewWillEnter,
} from '@ionic/angular';
import { ALIMENTO_REPOSITORY } from '../../nucleo/repositorios/alimento.repository';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import {
  REGISTRO_CONSUMO_REPOSITORY,
  NuevoRegistroConsumo,
} from '../../nucleo/repositorios/registro-consumo.repository';
import { Alimento } from '../../nucleo/modelos/alimento.model';
import { TipoComida } from '../../nucleo/modelos/registro-consumo.model';
import { fechaLocal } from '../../nucleo/utilidades/fecha';
import { PERFIL_ALIMENTO_REPOSITORY } from '../../nucleo/repositorios/perfil-alimento.repository';

const UNIDAD = 'unidad';
const BASE = 'base';
const COMIDA = 'comida';
const LIQUIDO = 'liquido';
const ML = 'ml';
const G = 'g';
const GRAMOS = 'gramos';
const DIRECTO = 'directo';
const MANUAL = 'manual';
@Component({
  selector: 'app-detalle-alimento',
  templateUrl: './detalle-alimento.component.html',
  styleUrls: ['./detalle-alimento.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    DecimalPipe,
    IonSegment,
    IonSegmentButton,
  ],
})
export class DetalleAlimentoComponent implements OnInit, ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alimentoRepository = inject(ALIMENTO_REPOSITORY);
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly registroConsumoRepository = inject(
    REGISTRO_CONSUMO_REPOSITORY,
  );
  private readonly perfilAlimentoRepository = inject(
    PERFIL_ALIMENTO_REPOSITORY,
  );

  protected readonly alimento = signal<Alimento | null>(null);
  protected readonly cantidad = signal(100);
  protected readonly modo = signal<'base' | 'unidad'>(BASE);
  protected readonly tipoComida = signal<TipoComida>(COMIDA);
  protected readonly esFavorito = signal(false);
  protected readonly definiendoUnidad = signal(false);
  protected readonly nombreUnidadTexto = signal('');
  protected readonly metodoUnidad = signal<'directo' | 'calculo'>(DIRECTO);
  protected readonly gramosUnidadTexto = signal('');
  protected readonly totalGramosTexto = signal('');
  protected readonly numeroUnidadesTexto = signal('');
  protected readonly mensaje = signal<string | null>(null);

  protected readonly kcalRacion = computed(() =>
    this.paraRacion((a) => a.kcal100g),
  );
  protected readonly proteinaRacion = computed(() =>
    this.paraRacion((a) => a.proteina100g),
  );
  protected readonly grasasRacion = computed(() =>
    this.paraRacion((a) => a.grasa100g),
  );
  protected readonly carbohidratosRacion = computed(() =>
    this.paraRacion((a) => a.carbohidrato100g),
  );
  protected readonly kcalAlcoholRacion = computed(() =>
    this.paraRacion((a) => a.kcalAlcohol100 ?? 0),
  );
  protected readonly tieneUnidad = computed(() => {
    const a = this.alimento();
    return a !== null && a.nombreUnidad !== null && a.gramosPorUnidad !== null;
  });
  protected etiquetaBase = computed(() =>
    this.alimento()?.tipoMedida === LIQUIDO ? ML : G,
  );
  protected readonly gramos = computed(() => {
    const gramosPorUnidad = this.alimento()?.gramosPorUnidad;
    return this.modo() === UNIDAD && gramosPorUnidad
      ? this.cantidad() * gramosPorUnidad
      : this.cantidad();
  });
  protected readonly gramosPorUnidadCalculados = computed(() => {
    if (this.metodoUnidad() === DIRECTO) {
      return this.aNumero(this.gramosUnidadTexto());
    }
    const unidades = this.aNumero(this.numeroUnidadesTexto());
    return unidades > 0 ? this.aNumero(this.totalGramosTexto()) / unidades : 0;
  });
  protected readonly unidadValida = computed(
    () =>
      this.nombreUnidadTexto().trim() !== '' &&
      this.gramosPorUnidadCalculados() > 0,
  );

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const alimento = await this.alimentoRepository.obtenerPorId(id);
    this.alimento.set(alimento);

    const perfil = await this.perfilRepository.obtenerUltimoUsado();
    if (!alimento || !perfil) {
      return;
    }
    const uso = await this.perfilAlimentoRepository.obtener(
      perfil.id,
      alimento.id,
    );
    this.esFavorito.set(uso?.esFavorito ?? false);
    if (uso?.ultimaCantidad && uso.ultimaUnidad) {
      if (uso.ultimaUnidad === GRAMOS) {
        this.cantidad.set(uso.ultimaCantidad);
      } else if (uso.ultimaUnidad === alimento.nombreUnidad) {
        this.modo.set(UNIDAD);
        this.cantidad.set(uso.ultimaCantidad);
      }
    }
  }

  async ionViewWillEnter(): Promise<void> {
    const actual = this.alimento();
    if (actual) {
      this.alimento.set(await this.alimentoRepository.obtenerPorId(actual.id));
    }
  }

  editar(): void {
    const alimento = this.alimento();
    if (alimento) {
      this.router.navigate(['/editar-alimento', alimento.id]);
    }
  }

  actualizarCantidad(valor: string | null | undefined): void {
    const numero = Number(valor);
    this.cantidad.set(Number.isFinite(numero) && numero > 0 ? numero : 0);
  }

  seleccionarModo(valor: unknown): void {
    const modo = valor === UNIDAD ? UNIDAD : BASE;
    if (modo === this.modo()) {
      return;
    }
    this.modo.set(modo);
    this.cantidad.set(modo === UNIDAD ? 1 : 100);
  }

  private aNumero(texto: string): number {
    const numero = Number(texto);
    return texto.trim() !== '' && Number.isFinite(numero) ? numero : 0;
  }

  actualizarTexto(
    senal: WritableSignal<string>,
    valor: string | null | undefined,
  ): void {
    senal.set(valor ?? '');
  }

  abrirDefinicion(): void {
    const alimento = this.alimento();
    this.nombreUnidadTexto.set(alimento?.nombreUnidad ?? '');
    this.gramosUnidadTexto.set(
      alimento?.gramosPorUnidad ? String(alimento.gramosPorUnidad) : '',
    );
    this.totalGramosTexto.set('');
    this.numeroUnidadesTexto.set('');
    this.metodoUnidad.set(DIRECTO);
    this.mensaje.set(null);
    this.definiendoUnidad.set(true);
  }

  cancelarDefinicion(): void {
    this.definiendoUnidad.set(false);
  }

  async guardarUnidad(): Promise<void> {
    const alimento = this.alimento();
    if (!alimento || !this.unidadValida()) {
      return;
    }
    this.mensaje.set(null);
    try {
      const actualizado: Alimento = {
        ...alimento,
        nombreUnidad: this.nombreUnidadTexto().trim(),
        gramosPorUnidad: this.gramosPorUnidadCalculados(),
        unidadOrigen: MANUAL,
      };
      await this.alimentoRepository.actualizar(actualizado);
      this.alimento.set(actualizado);
      this.modo.set(UNIDAD);
      this.cantidad.set(1);
      this.definiendoUnidad.set(false);
    } catch (error) {
      this.mensaje.set(`Error al guardar la unidad: ${error}`);
    }
  }

  async alternarFavorito(): Promise<void> {
    const alimento = this.alimento();
    const perfil = await this.perfilRepository.obtenerUltimoUsado();
    if (!alimento || !perfil) {
      return;
    }
    await this.perfilAlimentoRepository.alternarFavorito(
      perfil.id,
      alimento.id,
    );
    this.esFavorito.set(!this.esFavorito());
  }

  private paraRacion(valorPor100g: (alimento: Alimento) => number): number {
    const alimentoActual = this.alimento();
    return alimentoActual
      ? (valorPor100g(alimentoActual) * this.gramos()) / 100
      : 0;
  }

  async guardar(): Promise<void> {
    const alimentoActual = this.alimento();
    if (!alimentoActual) {
      return;
    }

    const perfil = await this.perfilRepository.obtenerUltimoUsado();
    if (!perfil) {
      return;
    }
    const unidadIntroducida =
      this.modo() === UNIDAD ? (alimentoActual.nombreUnidad ?? GRAMOS) : GRAMOS;

    const nuevo: NuevoRegistroConsumo = {
      perfilId: perfil.id,
      fecha: fechaLocal(),
      tipoComida: this.tipoComida(),
      alimentoId: alimentoActual.id,
      gramos: this.gramos(),
      cantidadIntroducida: this.cantidad(),
      unidadIntroducida: unidadIntroducida,
      kcal: this.kcalRacion(),
      proteinaG: this.proteinaRacion(),
      grasaG: this.grasasRacion(),
      carboHidratoG: this.carbohidratosRacion(),
      plantillaId: null,
      creadoEn: new Date().toISOString(),
      esEstimado: alimentoActual.esEstimado,
      kcalAlcohol: this.kcalAlcoholRacion(),
    };
    await this.registroConsumoRepository.guardar(nuevo);
    await this.perfilAlimentoRepository.registrarUso(
      perfil.id,
      alimentoActual.id,
      this.cantidad(),
      unidadIntroducida,
    );
    this.router.navigate(['/inicio']);
  }
}
