import { inject, Service } from '@angular/core';
import {
  ALIMENTO_REPOSITORY,
  NuevoAlimento,
} from '../repositorios/alimento.repository';
import { normalizarTexto } from '../utilidades/texto';

@Service()
export class CatalogoSemilla {
  private readonly alimentoRepository = inject(ALIMENTO_REPOSITORY);

  async cargarSiHaceFalta(): Promise<void> {
    const respuesta = await fetch('assets/catalogo-semilla.json');
    const catalogo = (await respuesta.json()) as NuevoAlimento[];

    const existentes = new Set(
      (await this.alimentoRepository.listarNombres()).map(normalizarTexto),
    );
    const faltan = catalogo.filter(
      (alimento) => !existentes.has(normalizarTexto(alimento.nombre)),
    );
    if (faltan.length > 0) {
      await this.alimentoRepository.insertarLote(faltan);
    }
  }
}
