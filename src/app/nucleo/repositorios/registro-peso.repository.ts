import { InjectionToken } from '@angular/core';
import { RegistroPeso } from '../modelos/registro-peso.model';

export type NuevoRegistroPeso = Omit<RegistroPeso, 'id'>;

export interface RegistroPesoRepository {
  crear(registro: NuevoRegistroPeso): Promise<RegistroPeso>;
  actualizar(registro: RegistroPeso): Promise<void>;
  obtenerPorFecha(
    perfilId: number,
    fecha: string,
  ): Promise<RegistroPeso | null>;
  obtenerUltimo(perfilId: number): Promise<RegistroPeso | null>;
}

export const REGISTRO_PESO_REPOSITORY =
  new InjectionToken<RegistroPesoRepository>('RegistroPesoRepository');
