import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  ViewWillEnter,
  AlertController,
} from '@ionic/angular';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ALIMENTO_REPOSITORY } from '../../nucleo/repositorios/alimento.repository';
import { Alimento } from '../../nucleo/modelos/alimento.model';
import { EscanerCodigoBarras } from '../../nucleo/servicios/escaner-codigo-barras';
import { ResolverAlimento } from '../../nucleo/servicios/resolver-alimento';
import { PERFIL_REPOSITORY } from '../../nucleo/repositorios/perfil.repository';
import { PERFIL_ALIMENTO_REPOSITORY } from '../../nucleo/repositorios/perfil-alimento.repository';
import { PLANTILLA_COMIDA_REPOSITORY } from '../../nucleo/repositorios/plantilla-comida.repository';
import { REGISTRO_CONSUMO_REPOSITORY } from '../../nucleo/repositorios/registro-consumo.repository';
import { PlantillaComida } from '../../nucleo/modelos/plantilla-comida.model';
import { InsertarComida } from '../../nucleo/servicios/insertar-comida';
import {
  GrupoComida,
  agruparPorComida,
  etiquetaComida,
} from '../../nucleo/utilidades/comidas';
import { fechaLocal, sumarDias } from '../../nucleo/utilidades/fecha';

const NO_ENCONTRADO = 'no_encontrado';
@Component({
  selector: 'app-anadir-alimento',
  templateUrl: './anadir-alimento.component.html',
  styleUrls: ['./anadir-alimento.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    DecimalPipe,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    NgTemplateOutlet,
  ],
})
export class AnadirAlimentoComponent implements OnInit, ViewWillEnter {
  private readonly escanerCodigoBarras = inject(EscanerCodigoBarras);
  private readonly resolverAlimento = inject(ResolverAlimento);
  private readonly router = inject(Router);
  private readonly alimentoRepository = inject(ALIMENTO_REPOSITORY);
  private readonly perfilRepository = inject(PERFIL_REPOSITORY);
  private readonly perfilAlimentoRepository = inject(
    PERFIL_ALIMENTO_REPOSITORY,
  );
  private readonly plantillaComidaRepository = inject(
    PLANTILLA_COMIDA_REPOSITORY,
  );
  private readonly registroConsumoRepository = inject(
    REGISTRO_CONSUMO_REPOSITORY,
  );
  private readonly insertarComida = inject(InsertarComida);
  private readonly alertController = inject(AlertController);

  protected readonly textoBusqueda = signal('');
  protected readonly resultados = signal<Alimento[]>([]);
  protected readonly mensaje = signal<string | null>(null);
  protected readonly favoritos = signal<Alimento[]>([]);
  protected readonly masUsados = signal<Alimento[]>([]);
  protected readonly codigoPendiente = signal<string | null>(null);
  protected readonly plantillas = signal<PlantillaComida[]>([]);
  protected readonly comidasAyer = signal<GrupoComida[]>([]);
  protected readonly etiquetaComida = etiquetaComida;

  async ionViewWillEnter(): Promise<void> {
    await this.cargarListas();
  }

  async ngOnInit(): Promise<void> {
    await this.cargarListas();
  }

  async escanear(): Promise<void> {
    this.mensaje.set(null);
    this.codigoPendiente.set(null);
    try {
      const resultadoEscaneo = await this.escanerCodigoBarras.escanear();
      if (!resultadoEscaneo.escaneado) {
        this.mensaje.set(this.mensajeEscaneo(resultadoEscaneo.motivo));
        return;
      }
      const resolucion = await this.resolverAlimento.obtenerPorCodigoDeBarras(
        resultadoEscaneo.codigo,
      );
      if (!resolucion.encontrado) {
        this.mensaje.set(this.mensajeResolucion(resolucion.motivo));
        if (resolucion.motivo === NO_ENCONTRADO) {
          this.codigoPendiente.set(resultadoEscaneo.codigo);
        }
        return;
      }
      this.router.navigate(['/detalle-alimento', resolucion.alimento.id]);
    } catch (error) {
      this.mensaje.set(`Error inesperado: ${error}`);
    }
  }

  async buscar(valor: string | null | undefined): Promise<void> {
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

  abrir(alimento: Alimento): void {
    this.router.navigate(['/detalle-alimento', alimento.id]);
  }

  crearAlimento(nombre?: string): void {
    this.router.navigate(['/editar-alimento'], {
      queryParams: nombre ? { nombre } : {},
    });
  }

  crearConCodigo(codigo: string): void {
    this.router.navigate(['/editar-alimento'], {
      queryParams: { codigo },
    });
  }

  protected kcalDe(grupo: GrupoComida): number {
    return grupo.registros.reduce((suma, registro) => suma + registro.kcal, 0);
  }

  async repetirDeAyer(grupo: GrupoComida): Promise<void> {
    await this.insertarComida.proponerDesdeRegistro(
      `Repetir ${etiquetaComida(grupo.tipo).toLowerCase()} de ayer`,
      grupo.tipo,
      grupo.registros,
    );
    this.router.navigate(['/insertar-comida']);
  }

  async usarPlantilla(plantilla: PlantillaComida): Promise<void> {
    await this.insertarComida.proponerDesdePlantilla(plantilla);
    this.router.navigate(['/insertar-comida']);
  }

  async pedirEliminarPlantilla(plantilla: PlantillaComida): Promise<void> {
    const alerta = await this.alertController.create({
      header: 'Eliminar plantilla',
      message: `Se borrará la plantilla «${plantilla.nombre}». Los registros que ya hiciste con ella no cambian.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.eliminarPlantilla(plantilla.id),
        },
      ],
    });
    await alerta.present();
  }

  private async eliminarPlantilla(id: number): Promise<void> {
    try {
      await this.plantillaComidaRepository.eliminar(id);
      await this.cargarListas();
    } catch (error) {
      this.mensaje.set(`Error al eliminar la plantilla: ${error}`);
    }
  }

  private async cargarListas(): Promise<void> {
    const perfil = await this.perfilRepository.obtenerUltimoUsado();
    if (!perfil) {
      return;
    }
    const favoritos = await this.perfilAlimentoRepository.listarFavorito(
      perfil.id,
    );
    const idsFavoritos = new Set(favoritos.map((a) => a.id));
    const masUsados = await this.perfilAlimentoRepository.listarMasUsado(
      perfil.id,
      10,
    );
    this.favoritos.set(favoritos);
    this.masUsados.set(masUsados.filter((a) => !idsFavoritos.has(a.id)));
    this.plantillas.set(await this.plantillaComidaRepository.listar(perfil.id));
    const ayer = await this.registroConsumoRepository.obtenerPorDia(
      perfil.id,
      sumarDias(fechaLocal(), -1),
    );
    this.comidasAyer.set(agruparPorComida(ayer));
  }

  private mensajeEscaneo(
    motivo: 'cancelado' | 'sin_permiso' | 'no_disponible',
  ): string | null {
    switch (motivo) {
      case 'cancelado':
        return null;
      case 'sin_permiso':
        return 'Necesito permiso de cámara para escanear.';
      case 'no_disponible':
        return 'El escáner no está disponible en este dispositivo.';
    }
  }

  private mensajeResolucion(motivo: 'no_encontrado' | 'sin_conexion'): string {
    switch (motivo) {
      case 'no_encontrado':
        return 'Producto no encontrado.';
      case 'sin_conexion':
        return 'Sin conexión. No se puede consultar el producto.';
    }
  }
}
