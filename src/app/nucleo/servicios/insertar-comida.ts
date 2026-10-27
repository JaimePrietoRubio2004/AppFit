import { inject, Service, signal } from '@angular/core';
import { Alimento } from '../modelos/alimento.model';
import { PlantillaComida } from '../modelos/plantilla-comida.model';
import { RegistroConsumo, TipoComida } from '../modelos/registro-consumo.model';
import { ALIMENTO_REPOSITORY } from '../repositorios/alimento.repository';
import { PERFIL_ALIMENTO_REPOSITORY } from '../repositorios/perfil-alimento.repository';
import { PLANTILLA_COMIDA_REPOSITORY } from '../repositorios/plantilla-comida.repository';
import { REGISTRO_CONSUMO_REPOSITORY } from '../repositorios/registro-consumo.repository';
import { fechaLocal } from '../utilidades/fecha';

const GRAMOS = 'gramos';

export interface LineaComida {
  alimento: Alimento;
  cantidad: number;
  unidad: string;
  gramosPorCantidad: number;
  aviso: string | null;
}

export interface PropuestaComida {
  titulo: string;
  tipoComida: TipoComida;
  plantillaId: number | null;
  lineas: LineaComida[];
  modo?: 'registrar' | 'plantilla';
}

@Service()
export class InsertarComida {
  private readonly alimentoRepository = inject(ALIMENTO_REPOSITORY);
  private readonly registroConsumoRepository = inject(
    REGISTRO_CONSUMO_REPOSITORY,
  );
  private readonly perfilAlimentoRepository = inject(
    PERFIL_ALIMENTO_REPOSITORY,
  );
  private readonly plantillaComidaRepository = inject(
    PLANTILLA_COMIDA_REPOSITORY,
  );

  readonly propuesta = signal<PropuestaComida | null>(null);

  async proponerDesdeRegistro(
    titulo: string,
    tipoComida: TipoComida,
    registros: RegistroConsumo[],
  ): Promise<void> {
    const lineas: LineaComida[] = [];
    for (const registro of registros) {
      const alimento = await this.alimentoRepository.obtenerPorId(
        registro.alimentoId,
      );
      if (!alimento) {
        continue;
      }
      lineas.push({
        alimento,
        cantidad: registro.cantidadIntroducida,
        unidad: registro.unidadIntroducida,
        gramosPorCantidad:
          registro.cantidadIntroducida > 0
            ? registro.gramos / registro.cantidadIntroducida
            : 1,
        aviso: null,
      });
    }
    this.propuesta.set({ titulo, tipoComida, plantillaId: null, lineas });
  }

  async proponerDesdePlantilla(plantilla: PlantillaComida): Promise<void> {
    const lineas: LineaComida[] = [];
    for (const linea of plantilla.lineas) {
      const alimento = await this.alimentoRepository.obtenerPorId(
        linea.alimentoId,
      );
      if (!alimento) {
        continue;
      }
      if (linea.unidad === GRAMOS) {
        lineas.push({
          alimento,
          cantidad: linea.cantidad,
          unidad: GRAMOS,
          gramosPorCantidad: 1,
          aviso: null,
        });
      } else if (
        alimento.nombreUnidad === linea.unidad &&
        alimento.gramosPorUnidad
      ) {
        lineas.push({
          alimento,
          cantidad: linea.cantidad,
          unidad: linea.unidad,
          gramosPorCantidad: alimento.gramosPorUnidad,
          aviso: null,
        });
      } else {
        lineas.push({
          alimento,
          cantidad: 100,
          unidad: GRAMOS,
          gramosPorCantidad: 1,
          aviso: `La unidad «${linea.unidad}» ya no existe en este alimento. Revisa la cantidad.`,
        });
      }
    }
    this.propuesta.set({
      titulo: plantilla.nombre,
      tipoComida: plantilla.tipoComidaSugerido,
      plantillaId: plantilla.id,
      lineas,
    });
  }

  proponerPlantillaNueva(): void {
    this.propuesta.set({
      titulo: 'Nueva plantilla',
      tipoComida: 'comida',
      plantillaId: null,
      lineas: [],
      modo: 'plantilla',
    });
  }

  async guardarComoPlantilla(
    perfilId: number,
    nombre: string,
    propuesta: PropuestaComida,
  ): Promise<void> {
    await this.plantillaComidaRepository.crear({
      perfilId,
      nombre,
      tipoComidaSugerido: propuesta.tipoComida,
      lineas: propuesta.lineas.map((linea) => ({
        alimentoId: linea.alimento.id,
        cantidad: linea.cantidad,
        unidad: linea.unidad,
      })),
    });
    this.propuesta.set(null);
  }

  async confirmar(perfilId: number, propuesta: PropuestaComida): Promise<void> {
    const fecha = fechaLocal();
    const marcaBase = Date.now();
    for (const [indice, linea] of propuesta.lineas.entries()) {
      const gramos = linea.cantidad * linea.gramosPorCantidad;
      const factor = gramos / 100;
      await this.registroConsumoRepository.guardar({
        perfilId,
        fecha,
        tipoComida: propuesta.tipoComida,
        alimentoId: linea.alimento.id,
        gramos,
        cantidadIntroducida: linea.cantidad,
        unidadIntroducida: linea.unidad,
        kcal: linea.alimento.kcal100g * factor,
        proteinaG: linea.alimento.proteina100g * factor,
        grasaG: linea.alimento.grasa100g * factor,
        carboHidratoG: linea.alimento.carbohidrato100g * factor,
        plantillaId: propuesta.plantillaId,
        creadoEn: new Date(marcaBase + indice).toISOString(),
      });
      await this.perfilAlimentoRepository.registrarUso(
        perfilId,
        linea.alimento.id,
        linea.cantidad,
        linea.unidad,
      );
    }
    if (propuesta.plantillaId !== null) {
      await this.plantillaComidaRepository.registroUso(propuesta.plantillaId);
    }
    this.propuesta.set(null);
  }
}
