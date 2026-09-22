import { inject, Service } from '@angular/core';
import type { Alimento } from '../modelos/alimento.model';
import { ALIMENTO_REPOSITORY } from '../repositorios/alimento.repository';
import { OpenFoodFacts } from './open-food-facts';

export type ResultadoResolucion =
  | { encontrado: true; alimento: Alimento }
  | { encontrado: false; motivo: 'no_encontrado' | 'sin_conexion' };

@Service()
export class ResolverAlimento {
  private readonly alimentoRepository = inject(ALIMENTO_REPOSITORY);
  private readonly openFoodFacts = inject(OpenFoodFacts);

  async obtenerPorCodigoDeBarras(
    codigoBarra: string,
  ): Promise<ResultadoResolucion> {
    const enCatalogo =
      await this.alimentoRepository.obtenerPorCodigoDeBarras(codigoBarra);
    if (enCatalogo) {
      return { encontrado: true, alimento: enCatalogo };
    }
    let nuevoAlimento;
    try {
      nuevoAlimento =
        await this.openFoodFacts.buscarPorCodigoDeBarras(codigoBarra);
    } catch {
      return { encontrado: false, motivo: 'sin_conexion' };
    }
    if (!nuevoAlimento) {
      return { encontrado: false, motivo: 'no_encontrado' };
    }
    const alimento = await this.alimentoRepository.crear(nuevoAlimento);
    return { encontrado: true, alimento };
  }
}
