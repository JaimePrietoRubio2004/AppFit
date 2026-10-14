import { inject, Service } from '@angular/core';
import { PerfilAlimentoRepository } from './perfil-alimento.repository';
import { Alimento } from '../modelos/alimento.model';
import { PerfilAlimento } from '../modelos/perfil-alimento.model';
import { BaseDatos } from '../base-datos/base-datos';
import { FilaAlimento, filaAAlimento } from './alimento-sqlite.repository';

interface FilaPerfilAlimento {
  perfil_id: number;
  alimento_id: number;
  es_favorito: number;
  veces_usado: number;
  ultima_cantidad: number | null;
  ultima_unidad: string | null;
}

@Service()
export class PerfilAlimentoSqlite implements PerfilAlimentoRepository {
  private readonly baseDatos = inject(BaseDatos);

  async registrarUso(
    perfilId: number,
    alimentoId: number,
    cantidad: number,
    unidad: string,
  ): Promise<void> {
    const db = await this.baseDatos.obtenerConexion();
    await db.run(
      `INSERT INTO perfil_alimento (perfil_id, alimento_id, veces_usado, ultima_cantidad, ultima_unidad)
       VALUES (?, ?, 1, ?, ?)
       ON CONFLICT (perfil_id, alimento_id) DO UPDATE SET
         veces_usado = veces_usado + 1,
         ultima_cantidad = excluded.ultima_cantidad,
         ultima_unidad = excluded.ultima_unidad`,
      [perfilId, alimentoId, cantidad, unidad],
      true,
      'no',
      false,
    );
  }
  async alternarFavorito(perfilId: number, alimentoId: number): Promise<void> {
    const db = await this.baseDatos.obtenerConexion();
    await db.run(
      `INSERT INTO perfil_alimento (perfil_id, alimento_id, es_favorito)
       VALUES (?, ?, 1)
       ON CONFLICT (perfil_id, alimento_id) DO UPDATE SET
         es_favorito = 1 - es_favorito`,
      [perfilId, alimentoId],
      true,
      'no',
      false,
    );
  }
  async obtener(
    perfilId: number,
    alimentoId: number,
  ): Promise<PerfilAlimento | null> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.query(
      'SELECT * FROM perfil_alimento WHERE perfil_id = ? AND alimento_id = ?',
      [perfilId, alimentoId],
      false,
    );
    const fila = resultado.values?.[0] as FilaPerfilAlimento | undefined;
    return fila
      ? {
          perfilId: fila.perfil_id,
          alimentoId: fila.alimento_id,
          esFavorito: fila.es_favorito === 1,
          vecesUsado: fila.veces_usado,
          ultimaCantidad: fila.ultima_cantidad,
          ultimaUnidad: fila.ultima_unidad,
        }
      : null;
  }
  async listarFavorito(perfilId: number): Promise<Alimento[]> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.query(
      `SELECT alimento.* FROM alimento
       JOIN perfil_alimento ON perfil_alimento.alimento_id = alimento.id
       WHERE perfil_alimento.perfil_id = ? AND perfil_alimento.es_favorito = 1
       ORDER BY alimento.nombre`,
      [perfilId],
      false,
    );
    return ((resultado.values ?? []) as FilaAlimento[]).map(filaAAlimento);
  }
  async listarMasUsado(perfilId: number, limite: number): Promise<Alimento[]> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.query(
      `SELECT alimento.* FROM alimento
       JOIN perfil_alimento ON perfil_alimento.alimento_id = alimento.id
       WHERE perfil_alimento.perfil_id = ? AND perfil_alimento.veces_usado > 0
       ORDER BY perfil_alimento.veces_usado DESC, alimento.nombre
       LIMIT ?`,
      [perfilId, limite],
      false,
    );
    return ((resultado.values ?? []) as FilaAlimento[]).map(filaAAlimento);
  }
}
