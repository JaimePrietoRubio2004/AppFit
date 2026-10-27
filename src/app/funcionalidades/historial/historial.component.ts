import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  AlertController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  ViewWillEnter,
  ToastController,
} from '@ionic/angular';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import { REGISTRO_CONSUMO_REPOSITORY } from '../../nucleo/repositorios/registro-consumo.repository';
import { ALIMENTO_REPOSITORY } from '../../nucleo/repositorios/alimento.repository';
import {
  RegistroConsumo,
  TipoComida,
} from '../../nucleo/modelos/registro-consumo.model';
import {
  etiquetaDia,
  fechaLocal,
  sumarDias,
} from '../../nucleo/utilidades/fecha';
import { Router } from '@angular/router';
import { PLANTILLA_COMIDA_REPOSITORY } from '../../nucleo/repositorios/plantilla-comida.repository';
import { InsertarComida } from '../../nucleo/servicios/insertar-comida';
import { GrupoComida, agruparPorComida } from '../../nucleo/utilidades/comidas';

const DIAS_POR_TANDA = 30;

interface DiaHistorial {
  fecha: string;
  kcal: number;
  proteinaG: number;
  grasaG: number;
  carbohidratoG: number;
  registros: RegistroConsumo[];
  kcalAlcohol: number;
}

@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.scss'],
  imports: [
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
  ],
})
export class HistorialComponent implements OnInit, ViewWillEnter {
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly registroConsumoRepository = inject(
    REGISTRO_CONSUMO_REPOSITORY,
  );
  private readonly alimentoRepository = inject(ALIMENTO_REPOSITORY);
  private readonly alertController = inject(AlertController);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly plantillaComidaRepository = inject(
    PLANTILLA_COMIDA_REPOSITORY,
  );
  private readonly insertarComida = inject(InsertarComida);

  protected readonly dias = signal<DiaHistorial[]>([]);
  protected readonly nombresAlimento = signal<Record<number, string>>({});
  protected readonly diaAbierto = signal<string | null>(null);
  protected readonly mensaje = signal<string | null>(null);
  protected diasMostrados = DIAS_POR_TANDA;

  protected readonly etiquetaDia = etiquetaDia;

  async ionViewWillEnter(): Promise<void> {
    await this.cargar();
  }

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  protected etiquetaComida(tipo: TipoComida): string {
    return tipo.charAt(0).toUpperCase() + tipo.slice(1);
  }

  protected descripcionCantidad(registro: RegistroConsumo): string {
    if (registro.unidadIntroducida === 'gramos') {
      return `${registro.gramos} g`;
    }
    return `${registro.cantidadIntroducida} ${registro.unidadIntroducida} (${registro.gramos} g)`;
  }

  protected alternarDia(fecha: string): void {
    this.diaAbierto.set(this.diaAbierto() === fecha ? null : fecha);
  }

  protected gruposDe(dia: DiaHistorial): GrupoComida[] {
    return agruparPorComida(dia.registros);
  }

  protected async repetir(grupo: GrupoComida): Promise<void> {
    await this.insertarComida.proponerDesdeRegistro(
      `Repetir ${this.etiquetaComida(grupo.tipo).toLowerCase()}`,
      grupo.tipo,
      grupo.registros,
    );
    this.router.navigate(['/insertar-comida']);
  }

  protected async pedirNombrePlantilla(grupo: GrupoComida): Promise<void> {
    const alerta = await this.alertController.create({
      header: 'Guardar como plantilla',
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
            void this.guardarPlantilla(grupo, nombre);
            return true;
          },
        },
      ],
    });
    await alerta.present();
  }

  private async guardarPlantilla(
    grupo: GrupoComida,
    nombre: string,
  ): Promise<void> {
    try {
      const perfil = await this.perfilRepository.obtenerUltimoUsado();
      if (!perfil) {
        return;
      }
      await this.plantillaComidaRepository.crear({
        perfilId: perfil.id,
        nombre,
        tipoComidaSugerido: grupo.tipo,
        lineas: grupo.registros.map((registro) => ({
          alimentoId: registro.alimentoId,
          cantidad: registro.cantidadIntroducida,
          unidad: registro.unidadIntroducida,
        })),
      });
      const aviso = await this.toastController.create({
        message: `Plantilla «${nombre}» guardada.`,
        duration: 2000,
      });
      await aviso.present();
    } catch (error) {
      this.mensaje.set(`Error al guardar la plantilla: ${error}`);
    }
  }

  protected async verMas(): Promise<void> {
    this.diasMostrados += DIAS_POR_TANDA;
    await this.cargar();
  }

  protected async pedirEliminar(registro: RegistroConsumo): Promise<void> {
    const nombre = this.nombresAlimento()[registro.alimentoId];
    const alerta = await this.alertController.create({
      header: 'Eliminar registro',
      message: `Se borrará "${nombre}" (${this.descripcionCantidad(registro)}) de este día.`,
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
    this.mensaje.set(null);
    try {
      await this.registroConsumoRepository.eliminar(id);
      await this.cargar();
    } catch (error) {
      this.mensaje.set(`Error al eliminar: ${error}`);
    }
  }

  private async cargar(): Promise<void> {
    const perfil = await this.perfilRepository.obtenerUltimoUsado();
    if (!perfil) {
      return;
    }
    const hasta = fechaLocal();
    const desde = sumarDias(hasta, -(this.diasMostrados - 1));
    const registros = await this.registroConsumoRepository.obtenerRango(
      perfil.id,
      desde,
      hasta,
    );

    const porDia = new Map<string, DiaHistorial>();
    for (const registro of registros) {
      const dia = porDia.get(registro.fecha) ?? {
        fecha: registro.fecha,
        kcal: 0,
        proteinaG: 0,
        grasaG: 0,
        carbohidratoG: 0,
        registros: [],
        kcalAlcohol: 0,
      };
      dia.kcal += registro.kcal;
      dia.proteinaG += registro.proteinaG;
      dia.grasaG += registro.grasaG;
      dia.carbohidratoG += registro.carboHidratoG;
      dia.kcalAlcohol += registro.kcalAlcohol;
      dia.registros.push(registro);
      porDia.set(registro.fecha, dia);
    }

    await this.cargarNombres(registros);
    this.dias.set(Array.from(porDia.values()).reverse());
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
