import { RegistroConsumo } from '../modelos/registro-consumo.model';

export type NuevoregistroConsumo = Omit<RegistroConsumo, 'id'>;

export interface RegistroConsumoRepository {
  guardar(registro: NuevoregistroConsumo): Promise<RegistroConsumo>;

  obtenerPorDia(perfilId: number, fecha: string): Promise<RegistroConsumo[]>;

  obtenerRango(
    perfilId: number,
    desde: string,
    hasta: string,
  ): Promise<RegistroConsumo[]>;

  eliminar(id: number): Promise<void>;
}
