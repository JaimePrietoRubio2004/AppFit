import {
  Component,
  OnInit,
  WritableSignal,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonToggle,
  IonText,
} from '@ionic/angular';
import { ALIMENTO_REPOSITORY } from '../../nucleo/repositorios/alimento.repository';
import { Alimento, TipoMedida } from '../../nucleo/modelos/alimento.model';

const SOLIDO = 'solido';

@Component({
  selector: 'app-editar-alimento',
  templateUrl: './editar-alimento.component.html',
  styleUrls: ['./editar-alimento.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonToggle,
    IonText,
  ],
})
export class EditarAlimentoComponent implements OnInit {
  private readonly alimentoRepository = inject(ALIMENTO_REPOSITORY);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly id = input<string>();
  readonly codigo = input<string>();
  readonly nombre = input<string>();

  protected readonly existente = signal<Alimento | null>(null);
  protected readonly nombreTexto = signal('');
  protected readonly marcaTexto = signal('');
  protected readonly tipoMedida = signal<TipoMedida>(SOLIDO);
  protected readonly kcalTexto = signal('');
  protected readonly proteinaTexto = signal('');
  protected readonly grasaTexto = signal('');
  protected readonly carbohidratoTexto = signal('');
  protected readonly azucaresTexto = signal('');
  protected readonly saturadasTexto = signal('');
  protected readonly fibraTexto = signal('');
  protected readonly salTexto = signal('');
  protected readonly esEstimado = signal(false);
  protected readonly mensaje = signal<string | null>(null);

  protected readonly camposObligatorios = [
    { etiqueta: 'Calorías (kcal)', texto: this.kcalTexto },
    { etiqueta: 'Proteína (g)', texto: this.proteinaTexto },
    { etiqueta: 'Grasa (g)', texto: this.grasaTexto },
    { etiqueta: 'Hidratos (g)', texto: this.carbohidratoTexto },
  ];
  protected readonly camposOpcionales = [
    { etiqueta: 'Azúcares (g)', texto: this.azucaresTexto },
    { etiqueta: 'Saturadas (g)', texto: this.saturadasTexto },
    { etiqueta: 'Fibra (g)', texto: this.fibraTexto },
    { etiqueta: 'Sal (g)', texto: this.salTexto },
  ];

  protected readonly kcal = computed(() => this.aNumero(this.kcalTexto()));
  protected readonly proteina = computed(() =>
    this.aNumero(this.proteinaTexto()),
  );
  protected readonly grasa = computed(() => this.aNumero(this.grasaTexto()));
  protected readonly carbohidrato = computed(() =>
    this.aNumero(this.carbohidratoTexto()),
  );

  protected readonly valido = computed(
    () =>
      this.nombreTexto().trim() !== '' &&
      this.kcal() !== null &&
      this.proteina() !== null &&
      this.grasa() !== null &&
      this.carbohidrato() !== null,
  );

  protected readonly avisoKcal = computed(() => {
    const kcal = this.kcal();
    const proteina = this.proteina();
    const grasa = this.grasa();
    const carbohidrato = this.carbohidrato();
    if (
      kcal === null ||
      proteina === null ||
      grasa === null ||
      carbohidrato === null
    ) {
      return null;
    }
    const esperado = 4 * proteina + 4 * carbohidrato + 9 * grasa;
    if (Math.abs(kcal - esperado) <= Math.max(0.2 * esperado, 5)) {
      return null;
    }
    return `Las kcal (${Math.round(kcal)}) no coinciden con lo que suman los macros (${Math.round(esperado)}). Revísalo; si incluye alcohol o fibra puede ser normal.`;
  });

  async ngOnInit(): Promise<void> {
    const id = this.id();
    if (id === undefined) {
      this.nombreTexto.set(this.nombre() ?? '');
      return;
    }
    const alimento = await this.alimentoRepository.obtenerPorId(Number(id));
    if (alimento) {
      this.existente.set(alimento);
      this.rellenar(alimento);
    }
  }

  private rellenar(alimento: Alimento): void {
    this.nombreTexto.set(alimento.nombre);
    this.marcaTexto.set(alimento.marca ?? '');
    this.tipoMedida.set(alimento.tipoMedida);
    this.kcalTexto.set(String(alimento.kcal100g));
    this.proteinaTexto.set(String(alimento.proteina100g));
    this.grasaTexto.set(String(alimento.grasa100g));
    this.carbohidratoTexto.set(String(alimento.carbohidrato100g));
    this.azucaresTexto.set(String(alimento.azucares100g));
    this.saturadasTexto.set(String(alimento.saturadas100g));
    this.fibraTexto.set(String(alimento.fibra100g));
    this.salTexto.set(String(alimento.sal100g));
    this.esEstimado.set(alimento.esEstimado);
  }

  private aNumero(texto: string): number | null {
    const numero = Number(texto);
    return texto.trim() !== '' && Number.isFinite(numero) && numero >= 0
      ? numero
      : null;
  }

  actualizarTexto(
    senal: WritableSignal<string>,
    valor: string | null | undefined,
  ): void {
    senal.set(valor ?? '');
  }

  async guardar(): Promise<void> {
    const kcal = this.kcal();
    const proteina = this.proteina();
    const grasa = this.grasa();
    const carbohidrato = this.carbohidrato();
    const nombre = this.nombreTexto().trim();
    if (
      nombre === '' ||
      kcal === null ||
      proteina === null ||
      grasa === null ||
      carbohidrato === null
    ) {
      return;
    }
    this.mensaje.set(null);
    try {
      const valores = {
        nombre,
        marca: this.marcaTexto().trim() || null,
        tipoMedida: this.tipoMedida(),
        kcal100g: kcal,
        proteina100g: proteina,
        grasa100g: grasa,
        carbohidrato100g: carbohidrato,
        azucares100g: this.aNumero(this.azucaresTexto()) ?? 0,
        saturadas100g: this.aNumero(this.saturadasTexto()) ?? 0,
        fibra100g: this.aNumero(this.fibraTexto()) ?? 0,
        sal100g: this.aNumero(this.salTexto()) ?? 0,
        esEstimado: this.esEstimado(),
      };
      const base = this.existente();
      if (base) {
        await this.alimentoRepository.actualizar({ ...base, ...valores });
        this.location.back();
        return;
      }
      const creado = await this.alimentoRepository.crear({
        ...valores,
        codigoBarras: this.codigo() ?? null,
        nombreUnidad: null,
        gramosPorUnidad: null,
        unidadOrigen: null,
        kcalAlcohol100: null,
        origen: 'manual',
        fechaCache: null,
      });
      this.router.navigate(['/detalle-alimento', creado.id], {
        replaceUrl: true,
      });
    } catch (error) {
      this.mensaje.set(`Error al guardar: ${error}`);
    }
  }
}
