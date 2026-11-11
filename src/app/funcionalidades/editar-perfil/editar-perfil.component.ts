import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe, Location } from '@angular/common';
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
  IonSelect,
  IonSelectOption,
  IonList,
  ViewWillEnter,
} from '@ionic/angular';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import { REGISTRO_PESO_REPOSITORY } from '../../nucleo/repositorios/registro-peso.repository';
import {
  CalculoObjetivo,
  ResultadoCalculadoObjetivo,
} from '../../nucleo/servicios/calculo-objetivo';
import {
  NivelActividad,
  ObjetivoCorporal,
  Perfil,
  Sexo,
} from '../../nucleo/modelos/perfil.model';
import { fechaLocal } from '../../nucleo/utilidades/fecha';
import { textoLimite } from '../../nucleo/utilidades/limite-objetivo';

const IMC_MINIMO = 18.5;

@Component({
  selector: 'app-editar-perfil',
  templateUrl: './editar-perfil.component.html',
  styleUrls: ['./editar-perfil.component.scss'],
  imports: [
    FormsModule,
    DecimalPipe,
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
  ],
})
export class EditarPerfilComponent implements ViewWillEnter {
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly registroPesoRepository = inject(REGISTRO_PESO_REPOSITORY);
  private readonly calculoObjetivo = inject(CalculoObjetivo);
  private readonly location = inject(Location);

  protected readonly textoLimite = textoLimite;

  protected readonly perfil = signal<Perfil | null>(null);
  protected readonly pesoActualKg = signal<number | null>(null);

  protected readonly nombre = signal('');
  protected readonly sexo = signal<Sexo>('hombre');
  protected readonly fechaNacimiento = signal('');
  protected readonly alturaCmTexto = signal('');
  protected readonly nivelActividad = signal<NivelActividad>('moderado');
  protected readonly objetivo = signal<ObjetivoCorporal>('recomposicion');
  protected readonly ritmoSemanalKgTexto = signal('');
  protected readonly pesoObjetivoKgTexto = signal('');
  protected readonly mensaje = signal<string | null>(null);

  private readonly alturaCm = computed(() =>
    this.aNumero(this.alturaCmTexto()),
  );

  private readonly ritmoSemanalKg = computed(
    () => this.aNumero(this.ritmoSemanalKgTexto()) ?? 0,
  );

  private readonly pesoObjetivoKg = computed(() =>
    this.aNumero(this.pesoObjetivoKgTexto()),
  );

  protected readonly errores = computed(() => {
    const errores: string[] = [];
    if (this.nombre().trim() === '') {
      errores.push('Escribe un nombre.');
    }
    const nacimiento = this.fechaNacimiento();
    if (nacimiento === '') {
      errores.push('Indica tu fecha de nacimiento.');
    } else if (nacimiento > fechaLocal()) {
      errores.push('La fecha de nacimiento no puede ser futura.');
    }
    const altura = this.alturaCm();
    const alturaValida = altura !== null && altura >= 100 && altura <= 250;
    if (!alturaValida) {
      errores.push('La altura debe estar entre 100 y 250 cm.');
    }
    if (this.objetivo() !== 'recomposicion') {
      const ritmo = this.ritmoSemanalKg();
      if (ritmo < 0 || ritmo > 2) {
        errores.push('El ritmo semanal debe estar entre 0 y 2 kg.');
      }
      const pesoObjetivo = this.pesoObjetivoKg();
      if (pesoObjetivo !== null) {
        if (pesoObjetivo < 30 || pesoObjetivo > 300) {
          errores.push('El peso objetivo debe estar entre 30 y 300 kg.');
        } else if (
          alturaValida &&
          pesoObjetivo / (altura / 100) ** 2 < IMC_MINIMO
        ) {
          errores.push(
            'No se puede fijar un peso objetivo con un IMC inferior a 18,5.',
          );
        }
      }
    }
    return errores;
  });

  protected readonly resultado = computed<ResultadoCalculadoObjetivo | null>(
    () => {
      const peso = this.pesoActualKg();
      const altura = this.alturaCm();
      if (peso === null || altura === null || this.errores().length > 0) {
        return null;
      }
      const recomposicion = this.objetivo() === 'recomposicion';
      return this.calculoObjetivo.calcular({
        sexo: this.sexo(),
        fechaNacimiento: this.fechaNacimiento(),
        alturaCm: altura,
        pesoKg: peso,
        pesoObjetivoKg: recomposicion ? null : this.pesoObjetivoKg(),
        nivelActividad: this.nivelActividad(),
        objetivo: this.objetivo(),
        ritmoSemanalKg: recomposicion ? 0 : this.ritmoSemanalKg(),
      });
    },
  );

  protected readonly puedeGuardar = computed(() => {
    if (this.perfil() === null || this.errores().length > 0) {
      return false;
    }
    const resultado = this.resultado();
    return resultado === null || resultado.calculado;
  });

  async ionViewWillEnter(): Promise<void> {
    this.mensaje.set(null);
    const perfil = await this.perfilRepository.obtenerUltimoUsado();
    this.perfil.set(perfil);
    if (!perfil) {
      return;
    }
    this.nombre.set(perfil.nombre);
    this.sexo.set(perfil.sexo);
    this.fechaNacimiento.set(perfil.fechaNacimiento);
    this.alturaCmTexto.set(String(perfil.alturaCm));
    this.nivelActividad.set(perfil.nivelActividad);
    this.objetivo.set(perfil.objetivo);
    this.ritmoSemanalKgTexto.set(
      perfil.ritmoSemanalKg ? String(perfil.ritmoSemanalKg) : '',
    );
    this.pesoObjetivoKgTexto.set(
      perfil.pesoObjetivoKg === null ? '' : String(perfil.pesoObjetivoKg),
    );
    const ultimo = await this.registroPesoRepository.obtenerUltimo(perfil.id);
    this.pesoActualKg.set(ultimo ? ultimo.pesoKg : null);
  }

  protected aTexto(valor: unknown): string {
    return valor === null || valor === undefined ? '' : String(valor);
  }

  private aNumero(texto: string): number | null {
    const limpio = texto.trim().replace(',', '.');
    if (limpio === '') {
      return null;
    }
    const numero = Number(limpio);
    return Number.isFinite(numero) ? numero : null;
  }

  cancelar(): void {
    this.location.back();
  }

  async guardar(): Promise<void> {
    const perfil = this.perfil();
    const altura = this.alturaCm();
    if (!perfil || altura === null || !this.puedeGuardar()) {
      return;
    }
    this.mensaje.set(null);
    const recomposicion = this.objetivo() === 'recomposicion';
    try {
      await this.perfilRepository.actualizar({
        ...perfil,
        nombre: this.nombre().trim(),
        sexo: this.sexo(),
        fechaNacimiento: this.fechaNacimiento(),
        alturaCm: altura,
        nivelActividad: this.nivelActividad(),
        objetivo: this.objetivo(),
        ritmoSemanalKg: recomposicion ? 0 : this.ritmoSemanalKg(),
        pesoObjetivoKg: recomposicion ? null : this.pesoObjetivoKg(),
      });
      this.location.back();
    } catch (error) {
      this.mensaje.set(`Error al guardar: ${error}`);
    }
  }
}
