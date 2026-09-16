import { Perfil } from '../modelos/perfil.model';
import { InjectionToken } from '@angular/core';

export type NuevoPerfil = Omit<Perfil, 'id'>;

export interface PerfilRepository {
  crear(perfil: NuevoPerfil): Promise<Perfil>;

  actualizar(perfil: Perfil): Promise<void>;

  eliminar(id: number): Promise<void>;

  obtenerPorId(id: number): Promise<Perfil | null>;

  obtenerUltimoUsado(): Promise<Perfil | null>;

  listar(): Promise<Perfil[]>;

  marcarComoUltimoUsado(id: number): Promise<void>;
}

export const PERFIL_REPOSITORY = new InjectionToken<PerfilRepository>(
  'PerfilRepository',
);
