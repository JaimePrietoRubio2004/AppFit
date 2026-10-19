import { inject, Service } from '@angular/core';
import {
  PlantillaComida,
  PlantillaComidaLinea,
} from '../modelos/plantilla-comida.model';
import { TipoComida } from '../modelos/registro-consumo.model';
import { BaseDatos } from '../base-datos/base-datos';
import {
  NuevaPlantillaComida,
  PlantillaComidaRepository,
} from './plantilla-comida.repository';

interface FilaPlantilla {
  id: number;
  perfil_id: number;
  nombre: string;
  tipo_comida_sugerido: TipoComida;
  veces_usada: number;
}

interface FilaLinea {
  plantilla_id: number;
  alimento_id: number;
  cantidad: number;
  unidad: string;
}

function filaAPlantilla(
  fila: FilaPlantilla,
  lineas: PlantillaComidaLinea[],
): PlantillaComida {
  return {
    id: fila.id,
    perfilId: fila.perfil_id,
    nombre: fila.nombre,
    tipoComidaSugerido: fila.tipo_comida_sugerido,
    vecesUsada: fila.veces_usada,
    lineas,
  };
}

function filaALinea(fila: FilaLinea): PlantillaComidaLinea {
  return {
    alimentoId: fila.alimento_id,
    cantidad: fila.cantidad,
    unidad: fila.unidad,
  };
}

@Service()
export class PlantillaComidaSqlite implements PlantillaComidaRepository {
  private readonly baseDatos = inject(BaseDatos);

  async crear(plantilla: NuevaPlantillaComida): Promise<PlantillaComida> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.run(
      `INSERT INTO plantilla_comida (perfil_id, nombre, tipo_comida_sugerido)
       VALUES (?, ?, ?)`,
      [plantilla.perfilId, plantilla.nombre, plantilla.tipoComidaSugerido],
      true,
      'no',
      false,
    );
    const id = resultado.changes?.lastId;
    if (id === undefined) {
      throw new Error('No se pudo obtener el id de la plantilla recien creada');
    }
    try {
      for (const linea of plantilla.lineas) {
        await db.run(
          `INSERT INTO plantilla_comida_linea (plantilla_id, alimento_id, cantidad, unidad)
           VALUES (?, ?, ?, ?)`,
          [id, linea.alimentoId, linea.cantidad, linea.unidad],
          true,
          'no',
          false,
        );
      }
    } catch (error) {
      await db.run(
        'DELETE FROM plantilla_comida WHERE id = ?',
        [id],
        true,
        'no',
        false,
      );
      throw error;
    }
    return {
      id,
      perfilId: plantilla.perfilId,
      nombre: plantilla.nombre,
      tipoComidaSugerido: plantilla.tipoComidaSugerido,
      vecesUsada: 0,
      lineas: plantilla.lineas,
    };
  }

  async listar(perfilId: number): Promise<PlantillaComida[]> {
    const db = await this.baseDatos.obtenerConexion();
    const plantillas = await db.query(
      `SELECT * FROM plantilla_comida WHERE perfil_id = ?
       ORDER BY veces_usada DESC, nombre`,
      [perfilId],
      false,
    );
    const lineas = await db.query(
      `SELECT * FROM plantilla_comida_linea
       WHERE plantilla_id IN (SELECT id FROM plantilla_comida WHERE perfil_id = ?)
       ORDER BY id`,
      [perfilId],
      false,
    );
    const lineasPorPlantilla = new Map<number, PlantillaComidaLinea[]>();
    for (const fila of (lineas.values ?? []) as FilaLinea[]) {
      const grupo = lineasPorPlantilla.get(fila.plantilla_id) ?? [];
      grupo.push(filaALinea(fila));
      lineasPorPlantilla.set(fila.plantilla_id, grupo);
    }
    return ((plantillas.values ?? []) as FilaPlantilla[]).map((fila) =>
      filaAPlantilla(fila, lineasPorPlantilla.get(fila.id) ?? []),
    );
  }

  async obtenerPorId(id: number): Promise<PlantillaComida | null> {
    const db = await this.baseDatos.obtenerConexion();
    const plantillas = await db.query(
      'SELECT * FROM plantilla_comida WHERE id = ?',
      [id],
      false,
    );
    const fila = plantillas.values?.[0] as FilaPlantilla | undefined;
    if (!fila) {
      return null;
    }
    const lineas = await db.query(
      'SELECT * FROM plantilla_comida_linea WHERE plantilla_id = ? ORDER BY id',
      [id],
      false,
    );
    return filaAPlantilla(
      fila,
      ((lineas.values ?? []) as FilaLinea[]).map(filaALinea),
    );
  }

  async registroUso(id: number): Promise<void> {
    const db = await this.baseDatos.obtenerConexion();
    await db.run(
      'UPDATE plantilla_comida SET veces_usada = veces_usada + 1 WHERE id = ?',
      [id],
      true,
      'no',
      false,
    );
  }

  async eliminar(id: number): Promise<void> {
    const db = await this.baseDatos.obtenerConexion();
    await db.run(
      'DELETE FROM plantilla_comida WHERE id = ?',
      [id],
      true,
      'no',
      false,
    );
  }
}
