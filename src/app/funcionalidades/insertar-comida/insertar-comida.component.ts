import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonSearchbar,
  AlertController,
  ToastController,
} from '@ionic/angular';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import { TipoComida } from '../../nucleo/modelos/registro-consumo.model';
import {
  InsertarComida,
  LineaComida,
} from '../../nucleo/servicios/insertar-comida';
import { ALIMENTO_REPOSITORY } from '../../nucleo/repositorios/alimento.repository';
import { Alimento } from '../../nucleo/modelos/alimento.model';

const GRAMOS = 'gramos';
const LIQUIDO = 'liquido';
const ML = 'ml';
const G = 'g';
@Component({
  selector: 'app-insertar-comida',
  templateUrl: './insertar-comida.component.html',
  styleUrls: ['./insertar-comida.component.scss'],
  imports: [
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSearchbar,
  ],
})
export class InsertarComidaComponent implements OnInit {
  private readonly insertarComida = inject(InsertarComida);
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly alimentoRepository = inject(ALIMENTO_REPOSITORY);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  private plantillaId: number | null = null;

  protected readonly titulo = signal('');
  protected readonly tipoComida = signal<TipoComida>('comida');
  protected readonly lineas = signal<LineaComida[]>([]);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly buscando = signal(false);
  protected readonly textoBusqueda = signal('');
  protected readonly resultados = signal<Alimento[]>([]);
  protected readonly modoPlantilla = signal(false);

  protected readonly totalKcal = computed(() =>
    this.lineas().reduce((suma, linea) => suma + this.kcalDe(linea), 0),
  );
  protected readonly puedeConfirmar = computed(
    () =>
      this.lineas().length > 0 &&
      this.lineas().every((linea) => linea.cantidad > 0),
  );

  ngOnInit(): void {
    const propuesta = this.insertarComida.propuesta();
    if (!propuesta) {
      this.router.navigate(['/inicio']);
      return;
    }
    this.titulo.set(propuesta.titulo);
    this.tipoComida.set(propuesta.tipoComida);
    this.plantillaId = propuesta.plantillaId;
    this.lineas.set(propuesta.lineas);
    this.modoPlantilla.set(propuesta.modo === 'plantilla');
  }

  protected gramosDe(linea: LineaComida): number {
    return linea.cantidad * linea.gramosPorCantidad;
  }

  protected kcalDe(linea: LineaComida): number {
    return (linea.alimento.kcal100g * this.gramosDe(linea)) / 100;
  }

  protected etiquetaUnidad(linea: LineaComida): string {
    if (linea.unidad !== GRAMOS) {
      return linea.unidad;
    }
    return linea.alimento.tipoMedida === LIQUIDO ? ML : G;
  }

  protected actualizarCantidad(
    indice: number,
    valor: string | null | undefined,
  ): void {
    const numero = Number(valor);
    const cantidad = Number.isFinite(numero) && numero > 0 ? numero : 0;
    this.lineas.update((lineas) =>
      lineas.map((linea, i) => (i === indice ? { ...linea, cantidad } : linea)),
    );
  }

  protected quitar(indice: number): void {
    this.lineas.update((lineas) => lineas.filter((_, i) => i !== indice));
  }

  protected abrirBusqueda(): void {
    this.textoBusqueda.set('');
    this.resultados.set([]);
    this.buscando.set(true);
  }

  protected cerrarBusqueda(): void {
    this.buscando.set(false);
  }

  protected async buscar(valor: string | null | undefined): Promise<void> {
    const texto = (valor ?? '').trim();
    this.textoBusqueda.set(texto);
    if (texto === '') {
      this.resultados.set([]);
      return;
    }
    const encontrados = await this.alimentoRepository.buscarPorTexto(texto);
    if (this.textoBusqueda() === texto) {
      this.resultados.set(encontrados);
    }
  }

  protected anadir(alimento: Alimento): void {
    this.lineas.update((lineas) => [
      ...lineas,
      {
        alimento,
        cantidad: 100,
        unidad: GRAMOS,
        gramosPorCantidad: 1,
        aviso: null,
      },
    ]);
    this.cerrarBusqueda();
  }

  protected async pedirNombrePlantilla(): Promise<void> {
    if (!this.puedeConfirmar()) {
      return;
    }
    const alerta = await this.alertController.create({
      header: 'Guardar plantilla',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          placeholder: 'Nombre (p. ej. Mi bocadillo)',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (datos: { nombre?: string }) => {
            const nombre = (datos.nombre ?? '').trim();
            if (nombre === '') {
              return false;
            }
            void this.guardarPlantilla(nombre);
            return true;
          },
        },
      ],
    });
    await alerta.present();
  }

  private async guardarPlantilla(nombre: string): Promise<void> {
    this.mensaje.set(null);
    try {
      const perfil = await this.perfilRepository.obtenerUltimoUsado();
      if (!perfil) {
        return;
      }
      await this.insertarComida.guardarComoPlantilla(perfil.id, nombre, {
        titulo: this.titulo(),
        tipoComida: this.tipoComida(),
        plantillaId: null,
        lineas: this.lineas(),
      });
      const aviso = await this.toastController.create({
        message: `Plantilla «${nombre}» guardada.`,
        duration: 2000,
      });
      await aviso.present();
      this.router.navigate(['/inicio']);
    } catch (error) {
      this.mensaje.set(`Error al guardar la plantilla: ${error}`);
    }
  }

  async confirmar(): Promise<void> {
    if (!this.puedeConfirmar()) {
      return;
    }
    this.mensaje.set(null);
    try {
      const perfil = await this.perfilRepository.obtenerUltimoUsado();
      if (!perfil) {
        return;
      }
      await this.insertarComida.confirmar(perfil.id, {
        titulo: this.titulo(),
        tipoComida: this.tipoComida(),
        plantillaId: this.plantillaId,
        lineas: this.lineas(),
      });
      this.router.navigate(['/inicio']);
    } catch (error) {
      this.mensaje.set(`Error al guardar: ${error}`);
    }
  }
}
