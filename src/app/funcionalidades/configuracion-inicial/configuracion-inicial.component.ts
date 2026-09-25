import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonList,
  IonText,
} from '@ionic/angular';

import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import { REGISTRO_PESO_REPOSITORY } from '../../nucleo/repositorios/registro-peso.repository';
import {
  CalculoObjetivo,
  ResultadoCalculadoObjetivo,
} from '../../nucleo/servicios/calculo-objetivo';
import {
  Sexo,
  NivelActividad,
  ObjetivoCorporal,
} from '../../nucleo/modelos/perfil.model';

const COLOR_AVATAR_POR_DEFECTO = '#0F766E';
@Component({
  selector: 'app-configuracion-inicial',
  templateUrl: './configuracion-inicial.component.html',
  styleUrls: ['./configuracion-inicial.component.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonList,
    IonText,
    DecimalPipe,
  ],
})
export class ConfiguracionInicialComponent {
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly registroPesoRepository = inject(REGISTRO_PESO_REPOSITORY);
  private readonly calculoObjetivo = inject(CalculoObjetivo);
  private readonly router = inject(Router);

  protected readonly paso = signal<1 | 2 | 3>(1);

  protected readonly nombre = signal('');
  protected readonly sexo = signal<Sexo>('hombre');
  protected readonly fechaNacimiento = signal('');
  protected readonly alturaCmTexto = signal('');
  protected readonly pesoKgTexto = signal('');
  protected readonly nivelActividad = signal<NivelActividad>('moderado');
  protected readonly objetivo = signal<ObjetivoCorporal>('recomposicion');
  protected readonly ritmoSemanalKgTexto = signal('');

  private readonly alturaCmNumero = computed(() => {
    const n = Number(this.alturaCmTexto());
    return this.alturaCmTexto() !== '' && !Number.isNaN(n) ? n : null;
  });

  private readonly pesoKgNumero = computed(() => {
    const n = Number(this.pesoKgTexto());
    return this.pesoKgTexto() !== '' && !Number.isNaN(n) ? n : null;
  });

  private readonly ritmoSemanalKgNumero = computed(() => {
    const n = Number(this.ritmoSemanalKgTexto());
    return Number.isNaN(n) ? 0 : n;
  });

  protected readonly paso1Valido = computed(
    () =>
      this.nombre().trim().length > 0 &&
      this.fechaNacimiento() !== '' &&
      this.alturaCmNumero() !== null &&
      this.pesoKgNumero() !== null,
  );

  protected readonly resultado = computed<ResultadoCalculadoObjetivo | null>(
    () => {
      const alturaCm = this.alturaCmNumero();
      const pesoKg = this.pesoKgNumero();
      if (!this.paso1Valido() || alturaCm === null || pesoKg === null) {
        return null;
      }
      return this.calculoObjetivo.calcular({
        sexo: this.sexo(),
        fechaNacimiento: this.fechaNacimiento(),
        alturaCm,
        pesoKg,
        nivelActividad: this.nivelActividad(),
        objetivo: this.objetivo(),
        ritmoSemanalKg: this.ritmoSemanalKgNumero(),
      });
    },
  );

  siguiente(): void {
    if (this.paso() === 1) this.paso.set(2);
    else if (this.paso() === 2) this.paso.set(3);
  }

  atras(): void {
    if (this.paso() === 3) this.paso.set(2);
    else if (this.paso() === 2) this.paso.set(1);
  }

  protected aTexto(valor: unknown): string {
    return valor === null || valor === undefined ? '' : String(valor);
  }

  async confirmar(): Promise<void> {
    const resultado = this.resultado();
    if (!resultado || !resultado.calculado) {
      return;
    }
    const fechaHoy = new Date().toISOString().slice(0, 10);
    const perfil = await this.perfilRepository.crear({
      nombre: this.nombre(),
      colorAvatar: COLOR_AVATAR_POR_DEFECTO,
      esUltimoUsado: true,
      sexo: this.sexo(),
      fechaNacimiento: this.fechaNacimiento(),
      alturaCm: this.alturaCmNumero()!,
      nivelActividad: this.nivelActividad(),
      objetivo: this.objetivo(),
      ritmoSemanalKg: this.ritmoSemanalKgNumero(),
      fechaAlta: fechaHoy,
    });
    await this.registroPesoRepository.crear({
      perfilId: perfil.id,
      fecha: fechaHoy,
      pesoKg: this.pesoKgNumero()!,
    });
    this.router.navigate(['/inicio']);
  }
}
