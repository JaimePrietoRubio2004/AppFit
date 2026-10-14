import { inject, Service } from '@angular/core';
import { REGISTRO_PESO_REPOSITORY } from '../repositorios/registro-peso.repository';
import { CalculoObjetivo, ObjetivoCalculado } from './calculo-objetivo';
import { Perfil } from '../modelos/perfil.model';

@Service()
export class ObjetivoPerfil {
  private readonly registroPesoRepository = inject(REGISTRO_PESO_REPOSITORY);
  private readonly calculoObjetivo = inject(CalculoObjetivo);

  async obtener(perfil: Perfil): Promise<ObjetivoCalculado | null> {
    const ultimoPeso = await this.registroPesoRepository.obtenerUltimo(
      perfil.id,
    );
    if (!ultimoPeso) {
      return null;
    }
    const resultado = this.calculoObjetivo.calcular({
      sexo: perfil.sexo,
      fechaNacimiento: perfil.fechaNacimiento,
      alturaCm: perfil.alturaCm,
      pesoKg: ultimoPeso.pesoKg,
      pesoObjetivoKg: perfil.pesoObjetivoKg,
      nivelActividad: perfil.nivelActividad,
      objetivo: perfil.objetivo,
      ritmoSemanalKg: perfil.ritmoSemanalKg,
    });
    return resultado.calculado ? resultado.objetivo : null;
  }
}
