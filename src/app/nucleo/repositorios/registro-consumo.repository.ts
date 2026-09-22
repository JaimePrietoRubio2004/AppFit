import { RegistroConsumo } from '../modelos/registro-consumo.model';
import { InjectionToken } from '@angular/core';

export type NuevoRegistroConsumo = Omit<RegistroConsumo, 'id'>;

export interface RegistroConsumoRepository {
  guardar(registro: NuevoRegistroConsumo): Promise<RegistroConsumo>;

  obtenerPorDia(perfilId: number, fecha: string): Promise<RegistroConsumo[]>;

  obtenerRango(
    perfilId: number,
    desde: string,
    hasta: string,
  ): Promise<RegistroConsumo[]>;

  eliminar(id: number): Promise<void>;
}

export const REGISTRO_CONSUMO_REPOSITORY =
  new InjectionToken<RegistroConsumoRepository>('RegistroConsumoRepository');
