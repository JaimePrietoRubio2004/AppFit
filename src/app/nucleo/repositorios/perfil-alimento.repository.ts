import { InjectionToken } from '@angular/core';
import { Alimento } from '../modelos/alimento.model';
import { PerfilAlimento } from '../modelos/perfil-alimento.model';

export interface PerfilAlimentoRepository {
  registrarUso(
    perfilId: number,
    alimentoId: number,
    cantidad: number,
    unidad: string,
  ): Promise<void>;

  alternarFavorito(perfilId: number, alimentoId: number): Promise<void>;

  obtener(perfilId: number, alimentoId: number): Promise<PerfilAlimento | null>;

  listarFavorito(perfilId: number): Promise<Alimento[]>;

  listarMasUsado(perfilId: number, limite: number): Promise<Alimento[]>;
}

export const PERFIL_ALIMENTO_REPOSITORY =
  new InjectionToken<PerfilAlimentoRepository>('PerfilAlimentoRepository');
