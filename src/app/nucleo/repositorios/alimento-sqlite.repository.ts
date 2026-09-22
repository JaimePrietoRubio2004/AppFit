import { inject, Service } from '@angular/core';
import { Alimento } from '../modelos/alimento.model';
import { AlimentoRepository, NuevoAlimento } from './alimento.repository';
import { BaseDatos } from '../base-datos/base-datos';

const COLUMNAS = `codigo_barras, nombre, marca, kcal_100g, proteina_100g, grasa_100g, carbohidrato_100g,
  azucares_100g, saturadas_100g, fibra_100g, sal_100g, nombre_unidad, gramos_por_unidad,
  unidad_origen, tipo_medida, kcal_alcohol_100, es_estimado, origen, fecha_cache`;

interface FilaAlimento {
  id: number;
  codigo_barras: string | null;
  nombre: string;
  marca: string | null;
  kcal_100g: number;
  proteina_100g: number;
  grasa_100g: number;
  carbohidrato_100g: number;
  azucares_100g: number;
  saturadas_100g: number;
  fibra_100g: number;
  sal_100g: number;
  nombre_unidad: string | null;
  gramos_por_unidad: number | null;
  unidad_origen: Alimento['unidadOrigen'];
  tipo_medida: Alimento['tipoMedida'];
  kcal_alcohol_100: number | null;
  es_estimado: number;
  origen: Alimento['origen'];
  fecha_cache: string | null;
}

function filaAAlimento(fila: FilaAlimento): Alimento {
  return {
    id: fila.id,
    codigoBarras: fila.codigo_barras,
    nombre: fila.nombre,
    marca: fila.marca,
    kcal100g: fila.kcal_100g,
    proteina100g: fila.proteina_100g,
    grasa100g: fila.grasa_100g,
    carbohidrato100g: fila.carbohidrato_100g,
    azucares100g: fila.azucares_100g,
    saturadas100g: fila.saturadas_100g,
    fibra100g: fila.fibra_100g,
    sal100g: fila.sal_100g,
    nombreUnidad: fila.nombre_unidad,
    gramosPorUnidad: fila.gramos_por_unidad,
    unidadOrigen: fila.unidad_origen,
    tipoMedida: fila.tipo_medida,
    kcalAlcohol100: fila.kcal_alcohol_100,
    esEstimado: fila.es_estimado === 1,
    origen: fila.origen,
    fechaCache: fila.fecha_cache,
  };
}

function valoresDe(alimento: NuevoAlimento): unknown[] {
  return [
    alimento.codigoBarras,
    alimento.nombre,
    alimento.marca,
    alimento.kcal100g,
    alimento.proteina100g,
    alimento.grasa100g,
    alimento.carbohidrato100g,
    alimento.azucares100g,
    alimento.saturadas100g,
    alimento.fibra100g,
    alimento.sal100g,
    alimento.nombreUnidad,
    alimento.gramosPorUnidad,
    alimento.unidadOrigen,
    alimento.tipoMedida,
    alimento.kcalAlcohol100,
    alimento.esEstimado ? 1 : 0,
    alimento.origen,
    alimento.fechaCache,
  ];
}

@Service()
export class AlimentoSqlite implements AlimentoRepository {
  private readonly baseDatos = inject(BaseDatos);

  async crear(alimento: NuevoAlimento): Promise<Alimento> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.run(
      `INSERT INTO alimento (${COLUMNAS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      valoresDe(alimento),
      true,
      'no',
      false,
    );
    const id = resultado.changes?.lastId;
    if (id === undefined) {
      throw new Error('No se pudo obtener el id del alimento recien creado');
    }
    return { ...alimento, id };
  }

  async insertarLote(alimentos: NuevoAlimento[]): Promise<void> {
    if (alimentos.length === 0) {
      return;
    }
    const db = await this.baseDatos.obtenerConexion();
    const sentencia = alimentos.map((alimento) => ({
      statement: `INSERT INTO alimento (${COLUMNAS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values: valoresDe(alimento),
    }));
    await db.executeSet(sentencia, true, 'no', false);
  }

  async actualizar(alimento: Alimento): Promise<void> {
    const db = await this.baseDatos.obtenerConexion();
    await db.run(
      `UPDATE alimento SET
        codigo_barras = ?, nombre = ?, marca = ?, kcal_100g = ?, proteina_100g = ?, grasa_100g = ?,
        carbohidrato_100g = ?, azucares_100g = ?, saturadas_100g = ?, fibra_100g = ?, sal_100g = ?,
        nombre_unidad = ?, gramos_por_unidad = ?, unidad_origen = ?, tipo_medida = ?,
        kcal_alcohol_100 = ?, es_estimado = ?, origen = ?, fecha_cache = ?
        WHERE id = ?`,
      [...valoresDe(alimento), alimento.id],
      true,
      'no',
      false,
    );
  }
  async obtenerPorId(id: number): Promise<Alimento | null> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.query(
      'SELECT * FROM alimento WHERE ID = ?',
      [id],
      false,
    );
    const fila = resultado.values?.[0] as FilaAlimento | undefined;
    return fila ? filaAAlimento(fila) : null;
  }
  async obtenerPorCodigoDeBarras(
    codigoBarras: string,
  ): Promise<Alimento | null> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.query(
      'SELECT * FROM alimento WHERE codigo_barras = ?',
      [codigoBarras],
      false,
    );
    const fila = resultado.values?.[0] as FilaAlimento | undefined;
    return fila ? filaAAlimento(fila) : null;
  }
  async buscarPorTexto(texto: string): Promise<Alimento[]> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.query(
      'SELECT * FROM alimento WHERE nombre LIKE ? ORDER BY nombre LIMIT 30',
      [`%${texto}%`],
      false,
    );
    return ((resultado.values ?? []) as FilaAlimento[]).map(filaAAlimento);
  }
  async existeCatalogoSemilla(): Promise<boolean> {
    const db = await this.baseDatos.obtenerConexion();
    const resultado = await db.query(
      "SELECT * FROM alimento WHERE origen = 'semilla' LIMIT 1",
      [],
      false,
    );
    return (resultado.values?.length ?? 0) > 0;
  }
}
