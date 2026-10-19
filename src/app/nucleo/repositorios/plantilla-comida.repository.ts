import { InjectionToken } from '@angular/core';
import {
  PlantillaComida,
  PlantillaComidaLinea,
} from '../modelos/plantilla-comida.model';
import { TipoComida } from '../modelos/registro-consumo.model';

export interface NuevaPlantillaComida {
  perfilId: number;
  nombre: string;
  tipoComidaSugerido: TipoComida;
  lineas: PlantillaComidaLinea[];
}

export interface PlantillaComidaRepository {
  crear(plantilla: NuevaPlantillaComida): Promise<PlantillaComida>;

  listar(perfilId: number): Promise<PlantillaComida[]>;

  obtenerPorId(id: number): Promise<PlantillaComida | null>;

  registroUso(id: number): Promise<void>;

  eliminar(id: number): Promise<void>;
}

export const PLANTILLA_COMIDA_REPOSITORY =
  new InjectionToken<PlantillaComidaRepository>('PlantillaComidaRepository');
