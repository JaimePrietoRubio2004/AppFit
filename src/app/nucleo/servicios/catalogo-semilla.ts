import { inject, Service } from '@angular/core';
import {
  ALIMENTO_REPOSITORY,
  NuevoAlimento,
} from '../repositorios/alimento.repository';

@Service()
export class CatalogoSemilla {
  private readonly alimentoRepository = inject(ALIMENTO_REPOSITORY);

  async cargarSiHaceFalta(): Promise<void> {
    const yaCargado = await this.alimentoRepository.existeCatalogoSemilla();
    if (yaCargado) {
      return;
    }
    const respuesta = await fetch('assets/catalogo-semilla.json');
    const alimentos = (await respuesta.json()) as NuevoAlimento[];

    await this.alimentoRepository.insertarLote(alimentos);
  }
}
