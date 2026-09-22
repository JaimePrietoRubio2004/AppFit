import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
} from '@ionic/angular';
import { ALIMENTO_REPOSITORY } from '../../nucleo/repositorios/alimento.repository';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import {
  REGISTRO_CONSUMO_REPOSITORY,
  NuevoRegistroConsumo,
} from '../../nucleo/repositorios/registro-consumo.repository';
import { Alimento } from '../../nucleo/modelos/alimento.model';
import { TipoComida } from '../../nucleo/modelos/registro-consumo.model';

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
  ],
})
export class DetalleAlimentoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alimentoRepository = inject(ALIMENTO_REPOSITORY);
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly registroConsumoRepository = inject(
    REGISTRO_CONSUMO_REPOSITORY,
  );

  protected readonly alimento = signal<Alimento | null>(null);
  protected readonly gramos = signal(100);
  protected readonly tipoComida = signal<TipoComida>('comida');

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

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.alimento.set(await this.alimentoRepository.obtenerPorId(id));
  }

  actualizarGramos(valor: string | null | undefined): void {
    const numero = Number(valor);
    this.gramos.set(Number.isFinite(numero) && numero > 0 ? numero : 0);
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
    const nuevo: NuevoRegistroConsumo = {
      perfilId: perfil.id,
      fecha: new Date().toISOString().slice(0, 10),
      tipoComida: this.tipoComida(),
      alimentoId: alimentoActual.id,
      gramos: this.gramos(),
      cantidadIntroducida: this.gramos(),
      unidadIntroducida: 'gramos',
      kcal: this.kcalRacion(),
      proteinaG: this.proteinaRacion(),
      grasaG: this.grasasRacion(),
      carboHidratoG: this.carbohidratosRacion(),
      plantillaId: null,
      creadoEn: new Date().toISOString(),
    };
    await this.registroConsumoRepository.guardar(nuevo);
    this.router.navigate(['/inicio']);
  }
}
