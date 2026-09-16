import { Alimento } from '../modelos/alimento.model';

export type NuevoAlimento = Omit<Alimento, 'id'>;

export interface AlimentoRepository {
  crear(alimento: NuevoAlimento): Promise<Alimento>;

  insertarLote(alimentos: NuevoAlimento[]): Promise<void>;

  actualizar(alimento: Alimento): Promise<void>;

  obtenerPorId(id: number): Promise<Alimento | null>;

  obtenerPorCodigoDeBarras(codigoBarras: string): Promise<Alimento | null>;

  buscarPorTexto(texto: string): Promise<Alimento[]>;
}
